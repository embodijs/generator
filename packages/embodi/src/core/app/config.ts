import { isRelativePath } from "core/utils/paths.js";
import { join } from "node:path";
import type { Plugin as VitePlugin, UserConfig as ViteConfig } from "vite";

export interface EmbodiUserConfig {
	base?: string;
	dist?: string;
	dataDir?: string;
	source?: `/${string}`;
	templatePrefix?: string;
	publicDir?: string;
	plugins?: VitePlugin[];
}

export interface PublicDirs {
	public: string;
	data: string;
	content: `/${string}`;;
	template: string | undefined;
}


export interface EmbodiConfig {
	statics: string;
	dist: string;
	templatePrefix: string;
	inputDirs: PublicDirs;
	viteConfig: ViteConfig;
}



export const defineConfig = (config: EmbodiUserConfig): EmbodiUserConfig => config;

export const loadConfig = async (cwd: string): Promise<EmbodiConfig> => {
	const { default: config } = (await import(join(cwd, ".embodi.js"))) as { default: EmbodiUserConfig };

	const publicDir = config.publicDir ?? "public";
	const templatePrefix = config.templatePrefix ?? "./__layout";
	const templateDir = isRelativePath(templatePrefix) ? templatePrefix : undefined;

	const mixedConfig = {
		dataDir: config.dataDir ?? "__data",
		statics: "",
		base: config.base ? config.base : "/",
		dist: config.dist ? config.dist : "dist",
		source: config.source ?? "/",
		templatePrefix: templatePrefix,
		inputDirs: {
			public: publicDir,
			data: config.dataDir ?? "__data",
			content: config.source ?? "/",
			template: templateDir
		},
		viteConfig: {
			plugins: config.plugins ?? [],
			publicDir,
			base: config.base ?? "/"
		}
	};

	return mixedConfig;
}