import { JsonFilesystem, type ContentManager } from "$core/content-manager/index.js";
import RenderEngine from "$core/elements/RenderEngine.js";
import { getContentFolder, getPageFolder, registerElement, runBeforeAll, setContentFolder, setPageFolder } from "$core/elements/register.js";
import type { PageFile } from "$exports/types";
import type { Plugin } from "vite";
import type { PluginContext } from "rollup";

import type { ViteEmbodiConfig } from "./types";
import { resolve, dirname } from "node:path";
export type { ViteEmbodiConfig };


const prepareHandlePage = (contentManager: ContentManager<PageFile>, basePath: string, rollupContext: PluginContext) => async (path: string): Promise<PageFile> => {
    const { content, ...meta} = await contentManager.load(path);
    const helper = new RenderEngine(dirname(resolve(basePath, path)), rollupContext);

    return {
        ...meta,
        content: await helper.compute(content)
    }
};

const handleInit = async (init: ViteEmbodiConfig) => {
    init.elements.forEach(({identifier, ...element}) => {
        const ids = Array.isArray(identifier) ? identifier : [identifier];
        registerElement(element, ...ids);
    });

    setPageFolder(init.pages);
    setContentFolder(init.content)
}


export const embodi = async (init: ViteEmbodiConfig): Promise<Plugin> => {

    const virtualModuleId = "virtual:embodi/pages";
    const resolveVirtualModuleId = "\0" + virtualModuleId

    let pages: PageFile[];

    return {
        name: 'vite-plugin-embodi',

       async buildStart() {

            handleInit(init);

            const pageBasePath = getPageFolder();
            const contentBasePath = getContentFolder();

            const engine = new RenderEngine(contentBasePath, this);
            await runBeforeAll(engine);

	        const pageManager = new JsonFilesystem<PageFile>(pageBasePath);
            const raw =  await pageManager.listOfIdentifiers();
            pages = await Promise.all(raw.map(prepareHandlePage(pageManager, pageBasePath, this)));
            
        },
        resolveId(id) {
            if(id === virtualModuleId){
                return resolveVirtualModuleId;
            }
        },
        async load(id) {
            if(id === resolveVirtualModuleId){
                return `export default ${JSON.stringify(pages)}`;
            }
        },
        transform(code, id) {
            console.log(`ID: ${id}`)
        }
    }
}
