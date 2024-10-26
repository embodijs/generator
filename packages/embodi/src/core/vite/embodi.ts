import { type Connect, type Plugin, type UserConfig } from 'vite';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { loadConfig } from '../app/config.js';
import { prerender } from '../app/prerender.js';
import packageJson from '../../../package.json' with { type: 'json' };
import {
	getVirtualParams,
	invalidateEmbodiModule,
	invalidateStoredCollection,
	isHotUpdate,
	isValidLoadId,
	storeLoadId,
	validateResolveId
} from './utils/virtuals.js';
import { loadAppHtml, loadData } from './utils/load-data.js';
import { generatePageImportCode, generateRoutesCode } from './utils/load-content.js';
import { type ServerResponse } from 'node:http';
import { generateCollectionsImportsCode } from './utils/collections.js';
import { isCompileException } from './utils/exceptions.js';

const cwd = process.cwd();
const cfd = dirname(fileURLToPath(import.meta.url));

export const configPlugin = () =>
	({
		name: 'embodi-config-plugin',
		async config(config, env) {
			const projectConfig = await loadConfig(cwd);
			const ssr = env.isSsrBuild;
			const distBase = projectConfig.dist ?? 'dist';
			const newConfig: UserConfig = {
				...config,
				...projectConfig.viteConfig,
				root: cwd,
				plugins: [...(config.plugins ?? []), ...(projectConfig.viteConfig.plugins ?? [])],
				resolve: {
					...config.resolve,
					alias: {
						'$embodi/*': resolve(cfd, './virtual-modules/embodi/*')
					}
				},
				build: {
					emptyOutDir: true,
					ssr,
					ssrManifest: !ssr,
					manifest: !ssr,
					outDir: ssr ? join(distBase, 'server') : join(distBase, 'static'),
					rollupOptions: {
						input: ssr
							? resolve(cfd, '../app/entry-server.js')
							: { client: resolve(cfd, '../app/entry-client.js') }
					}
				}
			};
			return newConfig;
		}
	}) satisfies Plugin;

export const virtualPlugin = () =>
	({
		name: 'embodi-virtual-plugin',
		async resolveId(id) {
			return validateResolveId(id, 'pages', 'paths', 'data', 'collections');
		},
		async load(id) {
			if (isValidLoadId(id, 'pages')) {
				const config = await loadConfig(cwd);
				const pagesCode = await generatePageImportCode(config.inputDirs);
				const routesCode = await generateRoutesCode(config.inputDirs);
				return `${pagesCode}\n${routesCode}\nexport const source = "${config.inputDirs.content}";`;
			} else if (isValidLoadId(id, 'paths')) {
				const { statics } = await loadConfig(cwd);
				const relativPathToClientEntry = relative(cwd, resolve(cfd, '../app/entry-client.js'));

				return `export const entryClient = "${relativPathToClientEntry}"; export const statics = "${statics}";`;
			} else if (isValidLoadId(id, 'data')) {
				const projectConfig = await loadConfig(cwd);

				const dataDirectoryPath = projectConfig.inputDirs.data;
				const data = await loadData(dataDirectoryPath);
				return `export const data = ${JSON.stringify(data)};`;
			} else if (isValidLoadId(id, 'collections')) {
				storeLoadId('collections', id);
				const params = getVirtualParams(id);

				return await generateCollectionsImportsCode({
					...params,
					only: params.only ? params.only.split(';') : undefined
				});
			}
		},
		async handleHotUpdate({ server, file }) {
			if (await isHotUpdate(file, 'data')) {
				await invalidateEmbodiModule(server, 'data');
				server.ws.send({
					type: 'full-reload'
				});
			} else if (await isHotUpdate(file, 'content')) {
				await invalidateStoredCollection(server, 'collections');
				server.ws.send({
					type: 'full-reload'
				});
			}
		},
		async configureServer(server) {
			// Invalidate pages and paths when content changes
			server.watcher.on('add', async (file: string) => {
				if (await isHotUpdate(file, 'content')) {
					await invalidateEmbodiModule(server, 'pages');
					await invalidateEmbodiModule(server, 'paths');
				}
			});
		}
	}) satisfies Plugin;

export const prerenderPlugin = () => {
	let isSsr = false;
	return {
		name: 'embodi-prerender-plugin',

		configResolved(config) {
			isSsr = !!config.build.ssr;
		},

		async writeBundle() {
			if (!isSsr) {
				return;
			}
			const { inputDirs, statics } = await loadConfig(cwd);
			await prerender({
				inputDirs,
				statics
			});
		}
	} satisfies Plugin;
};

export const devServerPlugin = () =>
	({
		name: 'embodi-dev-server-plugin',

		config(config) {
			return {
				...config,
				server: {
					...config.server,
					hmr: true
				}
			};
		},
		configureServer(server) {
			const devServer = async (
				req: Connect.IncomingMessage,
				res: ServerResponse,
				next: Connect.NextFunction,
				looped: boolean = false
			) => {
				// TODO: add static file route here
				try {
					const { inputDirs, statics } = await loadConfig(cwd);

					const rawTemplate = await loadAppHtml(statics);
					const template = await server.transformIndexHtml(req.originalUrl!, rawTemplate);
					const linkToClient = `<script type="module" defer src="/node_modules/${packageJson.name}/dist/core/app/entry-client.js"></script>`;
					const { render } = await server.ssrLoadModule(
						`/node_modules/${packageJson.name}/dist/core/app/entry-server.js`
					);

					const rendered = await render(inputDirs.content, req.originalUrl);
					if (!rendered) {
						return next();
					}

					const html = template
						.replace(`<!--app-head-->`, (rendered.head ?? '') + linkToClient)
						.replace(`<!--app-html-->`, rendered.html ?? '');
					res.writeHead(200, {
						'Content-Type': 'text/html',
						'Content-Length': html.length
					});
					return res.end(html);
				} catch (e) {
					if (isCompileException(e)) {
						console.warn(`Error in ${e.loc.file}:${e.loc.line}:${e.loc.column}`);
						console.error(e.message);
						console.error(e.frame);
					} else {
						console.error(e);
					}
					server.restart();
				}
			};

			server.middlewares.use(devServer);
		}
	}) satisfies Plugin;
