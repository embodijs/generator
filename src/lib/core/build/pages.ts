import { JsonFilesystem, type ContentManager } from "$core/content-manager/index.js";
import type { PageFile } from "$exports/types";
import { dirname, resolve } from "node:path";
import type { VitePluginContext } from "./contextHandlers.js";
import type BuildEngine from "./BuildEngine.js";

const _pages: PageFile[] = [];

export async function registerPage(...pages: Promise<PageFile>[] | PageFile[]) {
    const p = await Promise.all(pages);
    _pages.push(...p);
}

const prepareHandlePage = (contentManager: ContentManager<PageFile>, basePath: string, rollupContext: VitePluginContext, buildEngine: BuildEngine) => async (path: string): Promise<PageFile> => {
    const { content, ...meta} = await contentManager.load(path);
    const helper = buildEngine.createEngine(dirname(resolve(basePath, path)));

    return {
        ...meta,
        content: await helper.compute(content)
    }
};

export async function loadPages(path: string, context: VitePluginContext, buildEngine: BuildEngine) {
    const pageManager = new JsonFilesystem<PageFile>(path);
    const raw =  await pageManager.listOfIdentifiers();
    await registerPage(...raw.map(prepareHandlePage(pageManager, path, context, buildEngine)));
}

export async function updatePage(...pages: Promise<PageFile>[] | PageFile[]) {
    const p = await Promise.all(pages);
    p.forEach((page) => {
        const i = _pages.findIndex(p => p.slug === page.slug);
        if(i !== -1) {
            _pages[i] = page;
        }
    });
}

export function getPages(): PageFile[] {
    return _pages;
}