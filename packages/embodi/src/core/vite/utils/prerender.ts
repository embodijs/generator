import { FilesystemAdapter } from '@loom-io/node-filesystem-adapter';
import { loadAppHtml } from '../code-builder/load-data.js';
import { getRoutesToPrerender } from '../code-builder/load-content.js';
import type { PublicDirs } from './config.js';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { minify } from 'html-minifier-terser';

export interface PrerenderOptions {
	statics: string;
	inputDirs: PublicDirs;
}

const toAbsolute = (p: string) => {
	return pathToFileURL(path.resolve(process.cwd(), p)).href;
};

const fs = new FilesystemAdapter();

export const prerender = async ({ statics, inputDirs }: PrerenderOptions) => {
	const manifest = JSON.parse(await fs.file('/dist/static/.vite/manifest.json').text('utf-8'));
	const template = await loadAppHtml(statics);
	const minifiedTemplate = await minify(template, {
		collapseWhitespace: true,
		removeComments: false,
		removeRedundantAttributes: true,
		useShortDoctype: true
	});
	const { render, FileManager } = await import(toAbsolute('dist/server/entry-server.js'));
	// pre-render each route...
	const routesToPrerender = await getRoutesToPrerender(inputDirs);
	const fileManage = FileManager.getInstance();
	fileManage.setTemplate(minifiedTemplate);
	await Promise.all(routesToPrerender.map((url) => render(url, manifest)));
	fileManage.writeFiles();

	// done, delete .vite directory including ssr manifest
	// await fs.dir('/dist/static/.vite').delete(true);
	// await fs.dir('/dist/server').delete(true);
};
