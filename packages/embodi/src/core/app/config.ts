import { join } from 'node:path';
import type { Plugin as VitePlugin, UserConfig as ViteConfig } from 'vite';
import { pathToFileURL } from 'node:url';

export interface EmbodiUserConfig {
	base?: string;
	dist?: string;
	dataDir?: string;
	source?: `/${string}`;
	layoutDir?: string;
	publicDir?: string;
	plugins?: VitePlugin[];
}

export interface PublicDirs {
	public: string;
	data: string;
	content: `/${string}`;
	layout: string;
}

export interface EmbodiConfig {
	statics: string;
	dist: string;
	plugins: VitePlugin[];
	inputDirs: PublicDirs;
	viteConfig: ViteConfig;
}

export const defineConfig = (config: EmbodiUserConfig): EmbodiUserConfig => config;

export const loadConfig = async (cwd: string = process.cwd()): Promise<EmbodiConfig> => {
	const { default: config } = (await import(pathToFileURL(join(cwd, '.embodi.js')).href)) as {
		default: EmbodiUserConfig;
	};

	const publicDir = config.publicDir ?? 'public';
	const mixedConfig = {
		dataDir: config.dataDir ?? '__data',
		statics: '',
		base: config.base ? config.base : '/',
		dist: config.dist ? config.dist : 'dist',
		plugins: config.plugins ?? [],
		inputDirs: {
			public: publicDir,
			data: config.dataDir ?? '__data',
			content: config.source ?? '/content',
			layout: config.layoutDir ?? './__layout'
		},
		viteConfig: {
			plugins: config.plugins ?? [],
			publicDir,
			base: config.base ?? '/'
		}
	};

	return mixedConfig;
};
