import { nanoid } from "nanoid";
import type { PluginContext, EmittedAsset } from "rollup";

export interface VitePluginContext {
    emitFile: (data: EmittedAsset) => string;
    getFileName: PluginContext['getFileName'];
}

export class ViteDevContext implements VitePluginContext {
    
    #files: Record<string, string | Uint8Array | undefined> = {};
    #resolveIds: Record<string, string> = {};
    
    constructor(
        protected context: PluginContext,
        protected basePath: string,
    ) {}

    getFile(path: string) {
        return this.#files[path];
    }

    emitFile(data: EmittedAsset) {
        const path = `${this.basePath}${data.fileName ?? data?.name ?? ""}`;
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

    emitFile(data: EmittedAsset) {
        return this.context.emitFile(data);
    }

    getFileName(id: string) {
        return this.context.getFileName(id);
    }
}