import type { EmbodiBuildConfig } from "$exports/vite/types";
import { resolve } from "node:path";
import type { ResolvedConfig } from "vite";

export interface ViteEmbodiConfig {
    contentPath: string;
    pagesPath: string;
    isBuild: boolean;
}


let _config: ViteEmbodiConfig;

export function initConfig(e: EmbodiBuildConfig, v: ResolvedConfig ) {
    _config = {
        contentPath: resolve(e.contentPath),
        pagesPath: resolve(e.pagesPath),
        isBuild: v.command === "build",
    }
    return getConfig();
};

export function updateConfig(c: Partial<EmbodiBuildConfig>) {
    Object.assign(_config, c);
};

export function getConfig() {
    return _config ?? {};
}