import { JsonFilesystem, type ContentManager } from "$core/content-manager/index.js";
import RenderEngine from "$core/elements/RenderEngine.js";
import { getContentFolder, getPageFolder, registerElement, runBeforeAll, setContentFolder, setPageFolder } from "$core/elements/register.js";
import type { PageFile } from "$exports/types";
import type { Plugin, ResolvedConfig } from "vite";

import type { ViteEmbodiConfig } from "./types";
import { resolve, dirname, extname } from "node:path";
import { ViteBuildContext, ViteDevContext, type VitePluginContext } from "$core/elements/ContextHandlers.js";
import { nanoid } from "nanoid";
export type { ViteEmbodiConfig };


const prepareHandlePage = (contentManager: ContentManager<PageFile>, basePath: string, rollupContext: VitePluginContext) => async (path: string): Promise<PageFile> => {
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
    setContentFolder(init.content);
    
}


export const embodi = async (init: ViteEmbodiConfig): Promise<Plugin> => {

    const virtualModuleId = "virtual:embodi/data";
    const resolveVirtualModuleId = "\0" + virtualModuleId

    let pages: PageFile[];
    let config: ResolvedConfig;
    let contextHandle: VitePluginContext;
    const basePath = `/@embodi-${nanoid()}/`;

    return {
        name: 'vite-plugin-embodi',
        configResolved(resolvedConfig: ResolvedConfig) {
            // store the resolved config
            config = resolvedConfig
        },
        async buildStart() {

            handleInit(init);

            const pageBasePath = getPageFolder();
            const contentBasePath = getContentFolder();

            contextHandle = config.command === "serve" ? new ViteDevContext(this, basePath) : new ViteBuildContext(this);
        
            const engine = new RenderEngine(contentBasePath, contextHandle);
            await runBeforeAll(engine);

	        const pageManager = new JsonFilesystem<PageFile>(pageBasePath);
            const raw =  await pageManager.listOfIdentifiers();
            pages = await Promise.all(raw.map(prepareHandlePage(pageManager, pageBasePath, contextHandle)));
            
        },
        async resolveId(id ) {
            if(id === virtualModuleId){
                return resolveVirtualModuleId;
            }
        },
        async load(id) {
            if(id === resolveVirtualModuleId){
                console.log("LOAD", id)
                return `export const pages = ${JSON.stringify(pages)};export const contentPath = "${getContentFolder()}";export const pagePath = "${getPageFolder()}";`;
            }
        },
        async handleHotUpdate({file, server, read}) {
            if(!file.startsWith(resolve(init.pages))) return;
            const pageString = await read();

            const {content, ...meta} = <PageFile>JSON.parse(pageString);
            if(meta.type.toLowerCase() !== "page") return [];
            const helper = new RenderEngine(dirname(file), contextHandle);
            pages = await Promise.all(pages.map(async page => {
                if(page.slug === meta.slug) {
                    return {
                        ...meta,
                        content: await helper.compute(content)
                    }
                }
                return page;
            }));
            
            const module = await server.moduleGraph.getModuleByUrl(resolveVirtualModuleId);
            if(module == null) {
                return;
            }
            return [module];
        },
        configureServer(server) {
            server.watcher.add(resolve(init.content));
            server.middlewares.use((req, res, next) => {
                if(req.url?.startsWith(basePath)) {
                    console.log("Request for ", req.url);
                    const file = (contextHandle as ViteDevContext).getFile(req.url)
                    if(file != null) {
                        res.writeHead(200, {
                            'Content-Type': `image/${extname(req.url ?? "jpg")}}`,
                            'Content-Length': file.length
                        });
                        return res.end(file);
                    }
                }
                next();
            });
        }
    }
}
