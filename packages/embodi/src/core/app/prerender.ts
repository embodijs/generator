import path from 'node:path'
import { FilesystemAdapter } from '@loom-io/node-filesystem-adapter'
import type { LoomFile } from '@loom-io/core';

export interface PrerenderOptions {
	statics: string;
}

const fs = new FilesystemAdapter();

const toAbsolute = (p: string) => {
	return path.resolve(process.cwd(), p)
}

// determine routes to pre-render from src/pages
const getRoutesToPrerender = async () => {

	const dir = fs.dir('/');
	const files = (await dir.files(true)).filter<LoomFile>((file) => (file.name.endsWith('.md') && !file.path.startsWith('/node_modules')))
	return files
	.asArray()
  .map((file) => {
    const name = file.path.replace(/\.md$/, '')
    return name === '/index' ? `/` : `${name}`
  })
}

export const prerender = async ({ statics }: PrerenderOptions) => {

	const manifest = JSON.parse(
		await fs.file('/dist/static/.vite/manifest.json').text('utf-8')
	)
	const staticDir = await fs.dir(statics);
	const template = await staticDir.file('app.html').text('utf-8')

	const { render } = await import(toAbsolute('dist/server/entry-server.js'))

  // pre-render each route...
	const routesToPrerender = await getRoutesToPrerender()
  for (const url of routesToPrerender) {
		const rendered = await render(url, manifest)
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
	//await fs.dir('/dist/static/.vite').delete(true);
}