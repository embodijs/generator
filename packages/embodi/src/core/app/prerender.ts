import path from 'node:path';
import { FilesystemAdapter } from '@loom-io/node-filesystem-adapter';
import { loadAppHtml } from '../vite/utils/load-data.js';
import { getRoutesToPrerender } from '../vite/utils/load-content.js';
import type { PublicDirs } from './config.js';

export interface PrerenderOptions {
	statics: string;
	inputDirs: PublicDirs;
}

const fs = new FilesystemAdapter();

const toAbsolute = (p: string) => {
	return path.resolve(process.cwd(), p);
};

export const prerender = async ({ statics, inputDirs }: PrerenderOptions) => {
	const { content: contentDir } = inputDirs;
	const manifest = JSON.parse(await fs.file('/dist/static/.vite/manifest.json').text('utf-8'));
	const template = await loadAppHtml(statics);

	const { render } = await import('./entry-server.js');

	// pre-render each route...
	const routesToPrerender = await getRoutesToPrerender(inputDirs);
	for (const url of routesToPrerender) {
		const rendered = await render(contentDir, url, manifest);
		if (!rendered) continue;
		const { html: appHtml, head } = rendered;
		const html = template
			.replace(`<!--app-head-->`, head ?? '')
			.replace(`<!--app-html-->`, appHtml ?? '');

		const filePath = `dist/static${url === '/' ? '/index' : url}.html`;
		const file = fs.file(filePath);
		await file.create();
		await file.write(html);
	}

	// done, delete .vite directory including ssr manifest
	await fs.dir('/dist/static/.vite').delete(true);
	await fs.dir('/dist/server').delete(true);
};
