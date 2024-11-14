import { FilesystemAdapter } from '@loom-io/node-filesystem-adapter';
import { loadAppHtml } from '../vite/utils/load-data.js';
import { getRoutesToPrerender } from '../vite/utils/load-content.js';
import type { PublicDirs } from './config.js';
import path, { normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface PrerenderOptions {
	statics: string;
	inputDirs: PublicDirs;
}


const toAbsolute = (p: string) => {
	return pathToFileURL(path.resolve(process.cwd(), p)).href;
};

const fs = new FilesystemAdapter();

export const prerender = async ({ statics, inputDirs }: PrerenderOptions) => {
	const { content: contentDir } = inputDirs;
	const manifest = JSON.parse(await fs.file('/dist/static/.vite/manifest.json').text('utf-8'));
	const template = await loadAppHtml(statics);
	console.log('template', template);
	console.log('path', toAbsolute('dist/server/entry-server.js'));
	const { render } = await import(toAbsolute('dist/server/entry-server.js'));
	console.log('render', render);
	// pre-render each route...
	const routesToPrerender = await getRoutesToPrerender(inputDirs);
	console.log('routesToPrerender', routesToPrerender);
	for (const url of routesToPrerender) {
		const rendered = await render(contentDir, url, manifest);
		if (!rendered) continue;
		const { html: appHtml, head } = rendered;
		const html = template
			.replace(`<!--app-head-->`, head ?? '')
			.replace(`<!--app-html-->`, appHtml ?? '');

		// const filePath = `dist/static${url === '/' ? '/index' : url.slice(0, -1)}.html`;
		const filePath = `dist/static${url}index.html`;
		const file = fs.file(filePath);
		await file.create();
		await file.write(html);
	}

	// done, delete .vite directory including ssr manifest
	await fs.dir('/dist/static/.vite').delete(true);
	await fs.dir('/dist/server').delete(true);
};
