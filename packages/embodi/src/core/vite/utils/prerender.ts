import { FilesystemAdapter } from '@loom-io/node-filesystem-adapter';
import { loadAppHtml } from '../code-builder/load-data.js';
import { getRoutesToPrerender } from '../code-builder/load-content.js';
import type { PublicDirs } from './config.js';
import path from 'node:path';
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
	const { render } = await import(toAbsolute('dist/server/entry-server.js'));
	// pre-render each route...
	const routesToPrerender = await getRoutesToPrerender(inputDirs);
	for (const url of routesToPrerender) {
		const rendered = await render(contentDir, url, manifest);
		if (!rendered) continue;
		const { html: appHtml, head, data } = rendered;
		const html = template
			.replace(`<!--app-head-->`, head ?? '')
			.replace(`<!--app-html-->`, appHtml ?? '');

		// const filePath = `dist/static${url === '/' ? '/index' : url.slice(0, -1)}.html`;
		const filePath = `dist/static${url}index.html`;
		const dir = fs.dir(`dist/static${url}`);
		await dir.create();
		const htmlFile = dir.file('index.html');
		const dataFile = dir.file('data.json');
		await htmlFile.write(html);
		await dataFile.write(JSON.stringify(data));
	}

	// done, delete .vite directory including ssr manifest
	// await fs.dir('/dist/static/.vite').delete(true);
	// await fs.dir('/dist/server').delete(true);
};
