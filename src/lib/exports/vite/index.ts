import BuildEngine from "$core/build/BuildEngine.js";
import type { Plugin, ResolvedConfig } from "vite";

import type { EmbodiBuildConfig } from "./types";
import { dirname, extname } from "node:path";
import { ViteDevContext, VitePluginContext } from "$core/build/contextHandlers.js";
import { getPages, updatePage, loadPages } from "$core/build/pages.js";
import { getConfig, initConfig } from "$core/build/config.js";
import type { PageFile } from "$exports/types.d.ts";
export type { EmbodiBuildConfig };

export const embodi = async (init: EmbodiBuildConfig): Promise<Plugin[]> => {

    const virtualModuleId = "virtual:embodi/data";
    const resolveVirtualModuleId = "\0" + virtualModuleId

    let contextHandle: VitePluginContext;

    const embodiPlugin: Plugin = {
        name: 'vite-plugin-embodi',
        enforce: 'post',


        async configResolved(resolvedConfig: ResolvedConfig) {
            initConfig(init, resolvedConfig);
        },
        async buildStart() {

            const {pagesPath, contentPath} = getConfig();

            contextHandle = VitePluginContext.getInstance(this);
            const engine = new BuildEngine(contentPath, contextHandle);
            init.elements.forEach((element) => element(engine));

           loadPages(pagesPath, contextHandle);

            
        },
        async resolveId(id ) {
            if(id === virtualModuleId){
                return resolveVirtualModuleId;
            }
        },
        async load(id) {
            if(id === resolveVirtualModuleId){
                console.info("LOAD", id)
                const {contentPath, pagesPath} = getConfig();
                return `export const pages = ${JSON.stringify(getPages())};export const contentPath = "${contentPath}";export const pagePath = "${pagesPath}";`;
            }
        },
        
        async handleHotUpdate({file, server, read}) {
            const {pagesPath} = getConfig();
            if(!file.startsWith(pagesPath)) return;
            const pageString = await read();

            const {content, ...meta} = <PageFile>JSON.parse(pageString);
            if(meta.type.toLowerCase() !== "page") return;
            const helper = new BuildEngine(dirname(file), contextHandle);
            await updatePage({
                ...meta,
                content: await helper.compute(content)
            });
                  
            const module = await server.moduleGraph.getModuleByUrl(resolveVirtualModuleId);
            if(module == null) {
                return;
            }
            return [module];
        },
        configureServer(server) {
            const {contentPath} = getConfig();
            server.watcher.add(contentPath);
            
            server.middlewares.use((req, res, next) => {
                const context = contextHandle as ViteDevContext;
                const basePath = context.getBasePath();
                if(req.url?.startsWith(basePath)) {
                    console.log("Request for ", req.url);
                    const file = (context).getFile(req.url)
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

    return [embodiPlugin]
}
