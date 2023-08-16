import { nanoid } from "nanoid";
import type { PluginContext, EmittedAsset } from "rollup";
import { getConfig } from "./config.js";


export abstract class VitePluginContext implements VitePluginContext {
    abstract emitFile: (data: EmittedAsset) => string;
    abstract getFileName: PluginContext['getFileName'];
    abstract resolve: PluginContext['resolve'];
    abstract load: PluginContext['load'];
    abstract watchFiles: PluginContext['addWatchFile'];
    static instance: VitePluginContext | undefined;
    static getInstance(context: PluginContext) {

        const { isBuild } = getConfig();

        if(VitePluginContext.instance == null) {
            VitePluginContext.instance = isBuild === true ? new ViteBuildContext(context) : new ViteDevContext(context);
        }
        return VitePluginContext.instance;
    }
}


export class ViteDevContext implements VitePluginContext {
    
    #files: Record<string, string | Uint8Array | undefined> = {};
    #resolveIds: Record<string, string> = {};
    #basePath: string;
    private static instance: ViteDevContext | undefined;
    

    constructor(
        protected context: PluginContext
    ) {
        this.#basePath = `/__embodi-${nanoid()}/`;
    }

    getBasePath() {
        return this.#basePath;
    }

    getFile(path: string) {
        return this.#files[path];
    }

    watchFiles(...paths: string[]) {
        paths.forEach(path => {
            this.context.addWatchFile(path);
        });
    }

    load(...args: Parameters<PluginContext['load']>) {
        return this.context.load(...args);
    }

    resolve(...args: Parameters<PluginContext['resolve']>) {
        return this.context.resolve(...args);
    }

    emitFile(data: EmittedAsset) {
        const path = `${this.#basePath}${data.fileName ?? data?.name ?? ""}`;
        const id = nanoid();
        this.#files[path] = data.source;
        this.#resolveIds[id] = path;
        return id;
    }

    getFileName(id: string) {
        return this.#resolveIds[id];
    }

}


export class ViteBuildContext implements VitePluginContext {
    constructor(
        protected context: PluginContext,
    ) {}

    watchFiles(...paths: string[]) {
        paths.forEach(path => {
            this.context.addWatchFile(path);
        });
    }

    load(...args: Parameters<PluginContext['load']>) {
        return this.context.load(...args);
    }

    resolve(...args: Parameters<PluginContext['resolve']>) {
        return this.context.resolve(...args);
    }

    emitFile(data: EmittedAsset) {
        return this.context.emitFile(data);
    }

    getFileName(id: string) {
        return this.context.getFileName(id);
    }
}