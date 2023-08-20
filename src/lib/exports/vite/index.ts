import BuildEngine from "$core/build/BuildEngine.js";
import type { Plugin, ResolvedConfig } from "vite";

import type { EmbodiBuildConfig } from "./types";
import { dirname, extname } from "node:path";
import { ViteBuildContext, ViteDevContext, VitePluginContext } from "$core/build/contextHandlers.js";
import { getPages, updatePage, loadPages } from "$core/build/pages.js";
import { getConfig, initConfig } from "$core/build/config.js";
import type { PageFile } from "$exports/types.d.ts";
import ResolveElementComponents from "$core/build/ResolveElementComponents.js";
export type { EmbodiBuildConfig };

export const embodi = async (init: EmbodiBuildConfig): Promise<Plugin[]> => {

    let contextHandle: VitePluginContext;

    const embodiPlugin: Plugin = {
        name: 'vite-plugin-embodi',
        async configResolved(resolvedConfig: ResolvedConfig) {
            initConfig(init, resolvedConfig);
        },
        async buildStart() {

            const {pagesPath, contentPath, isBuild} = getConfig();

            contextHandle = isBuild === true ? new ViteBuildContext(this) : new ViteDevContext(this);
            const engine = new BuildEngine(contentPath, contextHandle);
            console.info("Building pages");
            await Promise.all(init.elements.map((element) => element(engine)));
            
            await loadPages(pagesPath, contextHandle);

            
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
                  
            const module = await server.moduleGraph.getModuleByUrl(resolveVirtualDataModuleId);
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

    const virtualDataModuleId = "$__embodi/data";
    const resolveVirtualDataModuleId = "\0" + virtualDataModuleId;
    const virtualSetupModuleId = "$__embodi/server/setup";
    const resolveVirtualSetupModuleId = "\0" + virtualSetupModuleId;
    const virtualComponentModuleId = "$__embodi/client/setup";
    const resolveVirtualComponentModuleId = "\0" + virtualComponentModuleId;

    const setupEmbodiVirtuals: Plugin = {
        name: "vite-plugin-embodi-setup",
        async resolveId(id ) {
            if(id === virtualDataModuleId){
                return resolveVirtualDataModuleId;
            } else if (id === virtualSetupModuleId) {
                return resolveVirtualSetupModuleId;
            } else if (id === virtualComponentModuleId) {
                return resolveVirtualComponentModuleId;
            }
        },
        async load(id) {
            if(id === resolveVirtualDataModuleId){
                const {contentPath, pagesPath} = getConfig();
                return `export const pages = ${JSON.stringify(getPages())};export const contentPath = "${contentPath}";export const pagePath = "${pagesPath}";`;
            }else if (id === resolveVirtualSetupModuleId) {
                console.info("Load Embodi Server Setup");
                return await BuildEngine.generateServerSetup();
            } else if (id === resolveVirtualComponentModuleId) {
                console.info("Load Embodi Client Setup")
                return BuildEngine.generateClientSetup();
            }
        },
    }

    let resolver: ResolveElementComponents;

    const resolveElementComponents: Plugin = {
        name: "vite-plugin-embodi-components",
        enforce: "pre",
        configResolved() {
            resolver = new ResolveElementComponents();
        },
            
        async resolveId(source, importer) {
            if(await resolver.partOfElement(source, importer)) {
                console.log("RESOLVE", source, importer);
            }
        }
    }

    return [embodiPlugin, setupEmbodiVirtuals]
}
