import { join } from "node:path";
import type { Plugin as VitePlugin } from "vite";

export interface EmbodiUserConfig {
	base?: string;
	dist?: string;
	dataDir?: string;
	source?: `/${string}`;
	templatePrefix?: string;
	publicDir?: string;
	plugins?: VitePlugin[];
}


export interface EmbodiConfig {
	statics: string;
	base: string;
	dist: string;
	dataDir: string;
	source: `/${string}`;
	templatePrefix: string;
	publicDir: string;
	plugins?: VitePlugin[];
}

export const defineConfig = (config: EmbodiUserConfig): EmbodiUserConfig => config;

export const loadConfig = async (cwd: string): Promise<EmbodiConfig> => {
	const { default: config } = (await import(join(cwd, ".embodi.js"))) as { default: EmbodiUserConfig };
	const mixedConfig = {
    ...config,
		dataDir: config.dataDir ?? "__data",
		statics: "",
		base: config.base ? config.base : "/",
		dist: config.dist ? config.dist : "dist",
		source: config.source ?? "/",
		templatePrefix: config.templatePrefix ? config.templatePrefix : "./__layout",
		publicDir: config.publicDir ?? "public"
	};

	return mixedConfig;
}