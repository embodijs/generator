import { join } from 'node:path';
import type { Plugin as VitePlugin, UserConfig as ViteConfig } from 'vite';
import { buildSync } from 'esbuild';
import { Dirent, readdirSync } from 'node:fs';
import * as v from 'valibot';
import assert from 'node:assert';
import { importCodeString } from './virtuals.js';

export const VitePluginSchema = v.custom<VitePlugin>(
	(value) => value != null,
	'Invalid Vite plugin'
);

export const FullPathSchema = v.custom<`/${string}`>(
	(value) => value != null && typeof value === 'string' && value.startsWith('/'),
	'Invalid full path'
);

export const EmbodiUserConfigSchema = v.object({
	base: v.optional(v.string()),
	dist: v.optional(v.string()),
	dataDir: v.optional(v.string()),
	source: v.optional(FullPathSchema),
	layoutDir: v.optional(v.string()),
	assetsDir: v.optional(v.string()),
	publicDir: v.optional(v.string()),
	plugins: v.optional(v.array(VitePluginSchema))
});

export type EmbodiUserConfig = v.InferOutput<typeof EmbodiUserConfigSchema>;

export interface PublicDirs {
	public: string;
	data: string;
	assets: string;
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

const getFullPath = (file: Dirent) => {
	const path = join(file.parentPath, file.name);
	return path;
};

export const isFileType = (file: Dirent, type: string) => file.isFile() && file.name.endsWith(type);

export const importConfigFile = (name: string, path: string = process.cwd()) => {
	const dir = readdirSync(path, { withFileTypes: true });
	const file = dir.find(
		(file) => file.isFile() && (file.name === `${name}.js` || file.name === `${name}.ts`)
	);

	if (!file) {
		return;
	}
	const filePath = getFullPath(file);
	if (isFileType(file, 'js')) {
		return import(filePath);
	} else if (isFileType(file, 'ts')) {
		const result = buildSync({
			entryPoints: [filePath],
			bundle: true,
			format: 'esm',
			platform: 'node',
			write: false // output to memory
		});
		const code = result.outputFiles[0].text;

		return importCodeString(code);
	} else {
		return;
	}
};

export const loadConfig = async (cwd: string = process.cwd()): Promise<EmbodiConfig> => {
	const fileImport = await importConfigFile('.embodi', cwd);

	//TODO: Maybe check if any config file is listed in the directory before importing
	assert(fileImport.default);

	const config = v.parse(EmbodiUserConfigSchema, fileImport.default);

	const publicDir = config.publicDir ?? 'public';
	const mixedConfig: EmbodiConfig = {
		statics: '',
		dist: config.dist ? config.dist : 'dist',
		plugins: config.plugins ?? [],
		inputDirs: {
			public: publicDir,
			assets: config.assetsDir ?? './assets',
			data: config.dataDir ?? '__data',
			content: config.source ?? '/content',
			layout: config.layoutDir ?? './__layout'
		},
		viteConfig: {
			plugins: (config.plugins ?? []) as VitePlugin[],
			publicDir,
			base: config.base ?? '/'
		}
	};

	return mixedConfig;
};
