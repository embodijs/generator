import type { Plugin, UserConfig } from "vite";
import * as fs from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from "node:url";
import { FilesystemAdapter } from "@loom-io/node-filesystem-adapter";
import { relative } from "node:path";


const cwd = process.cwd();
const cfd = dirname(fileURLToPath(import.meta.url));
console.log(relative(cwd, resolve(cfd, "../app/entry-client.js")))

export const configPlugin = () => ({
		name: "embodi-config-plugin",
		config(config, env) {
			const ssr = env.isSsrBuild;

			console.log('ssr', ssr);
			const newConfig: UserConfig = {
				...config,
				root: process.cwd(),
				optimizeDeps: {
					entries: ['content/**/*.md']
				},
				build: {
					emptyOutDir: true,
					ssr,
					ssrManifest: !ssr,
					manifest: !ssr,
					outDir: ssr ? "dist/server" : "dist/static",
					rollupOptions: {
						input: ssr ? resolve(cfd, "../app/entry-server.js") : {client: resolve(cfd, "../app/entry-client.js")}
					}
				}
			}
			return newConfig;
		},
		configResolved(config) {
			//console.log('configResolved', config);
		},
	}) satisfies Plugin

	export const virtualPlugin = () => ({
		name: "embodi-virtual-plugin",
		async resolveId(id) {
			if(id === '$embodi/pages') {
				return `\0${id}`;
			} else if(id === '$embodi/paths') {
				return `\0${id}`;
			}
		},
		async load(id) {
			if(id === '\0$embodi/pages') {
				return `const pages = import.meta.glob("/**/*.md"); export { pages }`
			} else if(id === '\0$embodi/paths') {
				const relativPathToClientEntry = relative(cwd, resolve(cfd, "../app/entry-client.js"));

				return `export const entryClient = "${relativPathToClientEntry}"`
			}
		}
	}) satisfies Plugin;

	export const devServerPlugin = () => ({
		name: "embodi-dev-server-plugin",
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {

				const template = await fs.readFile("app.html", "utf-8");
				const linkToClient = `<script type="module" src="/node_modules/@embodi/compiler/dist/core/app/entry-client.js"></script>`;
				const { render } = await server.ssrLoadModule("/node_modules/@embodi/compiler/dist/core/app/entry-server.js");

				const rendered = await render(req.originalUrl);
				if(!rendered) {
					return next();
				}

				const html = template
					.replace(`<!--app-head-->`, rendered.head ?? '')
					.replace(`<!--app-html-->`, (rendered.html ?? '') + linkToClient)
				res.writeHead(200, {
					"Content-Type": "text/html",
					'Content-Length': html.length
				})
				return res.end(html);
			})
		}
	}) satisfies Plugin;

	export const previewServerPlugin = () => ({
		name: "embodi-preview-server-plugin",
		async configurePreviewServer(server) {
			const fsAdapter = new FilesystemAdapter(resolve(cwd, 'dist/static'));
			// server.middlewares.use(async (req, res, next) => {
			// 	if(!req.originalUrl) {
			// 		return next();
			// 	}
			// 	console.log('preview', req.originalUrl);
			// 	const file = fsAdapter.file(req.originalUrl);
			// 	console.log('file', file.path);
			// 	if(await file.exists()) {
			// 		const content = await file.text();
			// 		console.log('content', content);
			// 		res.writeHead(200, {
			// 			"Content-Type": `text/${file.extension}`,
			// 			'Content-Length': content.length
			// 		})
			// 		return res.end(content);
			// 	}

			// 	next();
			// });

			// server.middlewares.use(async (req, res, next) => {
			// 	const file = fsAdapter.file(`${req.originalUrl}.html`);

			// 	if(await file.exists()) {
			// 		const html = await file.text();
			// 		res.writeHead(200, {
			// 			"Content-Type": "text/html",
			// 			'Content-Length': html.length
			// 		})
			// 		return res.end(html);
			// 	}

			// 	next();
			// });
		}
	}) satisfies Plugin;

