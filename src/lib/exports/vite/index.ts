import { JsonFilesystem, type ContentManager } from "$core/content-manager/index.js";
import RenderEngine from "$core/elements/RenderEngine.js";
import { getContentFolder, getPageFolder, registerElement, runBeforeAll, setContentFolder, setPageFolder } from "$core/elements/register.js";
import type { PageFile } from "$exports/types";
import type { Plugin } from "vite";

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
    setContentFolder(init.content)
}


export const embodi = async (init: ViteEmbodiConfig): Promise<Plugin> => {

    const virtualModuleId = "virtual:embodi/pages";
    const resolveVirtualModuleId = "\0" + virtualModuleId

    let pages: PageFile[];
    let config: unknown;
    let contextHandle: VitePluginContext;
    const basePath = `/@embodi-${nanoid()}/`;

    return {
        name: 'vite-plugin-embodi',
        configResolved(resolvedConfig) {
            // store the resolved config
            config = resolvedConfig
        },
        async buildStart() {

            handleInit(init);

            const pageBasePath = getPageFolder();
            const contentBasePath = getContentFolder();

            contextHandle = config.command === "serve" ? new ViteDevContext(basePath) : new ViteBuildContext(this);      
        
            const engine = new RenderEngine(contentBasePath, contextHandle);
            await runBeforeAll(engine);

	        const pageManager = new JsonFilesystem<PageFile>(pageBasePath);
            const raw =  await pageManager.listOfIdentifiers();
            pages = await Promise.all(raw.map(prepareHandlePage(pageManager, pageBasePath, contextHandle)));
            
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
        configureServer(server) {
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
