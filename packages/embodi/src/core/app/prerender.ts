import path from 'node:path'
import { FilesystemAdapter } from '@loom-io/node-filesystem-adapter'
import type { LoomFile } from '@loom-io/core';
import { loadAppHtml } from '../vite/utils/load-data.js';

export interface PrerenderOptions {
	statics: string;
	source: `/${string}`;
}

const fs = new FilesystemAdapter();

const toAbsolute = (p: string) => {
	return path.resolve(process.cwd(), p)
}

// determine routes to pre-render from src/pages
const getRoutesToPrerender = async (source: string) => {
	const sourceLength = source === '/' ? 0 : source.length;
	const dir = fs.dir(source);
	const files = (await dir.files(true)).filter<LoomFile>((file) => (file.name.endsWith('.md') && !file.path.startsWith('/node_modules')))
	return files
	.asArray()
  .map((file) => {
    const name = file.path.slice(sourceLength).replace(/\.md$/, '')
    return name === '/index' ? `/` : `${name}`
  })
}

export const prerender = async ({ statics, source }: PrerenderOptions) => {
	const manifest = JSON.parse(
		await fs.file('/dist/static/.vite/manifest.json').text('utf-8')
	)
	const template = await loadAppHtml(statics);

	const { render } = await import(toAbsolute('dist/server/entry-server.js'))

  // pre-render each route...
	const routesToPrerender = await getRoutesToPrerender(source)
  for (const url of routesToPrerender) {
		const rendered = await render(source, url, manifest)
		if(!rendered) continue;
		const { html: appHtml, css, head} = rendered;
    const html = template
      .replace(`<!--app-head-->`, head ?? '')
      .replace(`<!--app-html-->`, appHtml ?? '')
			.replace(`<!--app-styles-->`, css ?? '')

    const filePath = `dist/static${url === '/' ? '/index' : url}.html`
		const file = fs.file(filePath);
		await file.create();
		await file.write(html);
  }

  // done, delete .vite directory including ssr manifest
	await fs.dir('/dist/static/.vite').delete(true);
	await fs.dir('/dist/server').delete(true);
}