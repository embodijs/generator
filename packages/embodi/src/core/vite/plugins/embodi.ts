import { type Connect, type Plugin, type UserConfig } from 'vite';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { getSrcDestDirs, loadConfig } from '../utils/config.js';
import { prerender } from '../utils/prerender.js';
import packageJson from '../../../../package.json' with { type: 'json' };
import {
	getVirtualParams,
	invalidateStoredCollection,
	isHotUpdate,
	prepareIdValidator,
	resolvePipe,
	storeLoadId
} from '../utils/virtuals.js';
import { loadAppHtml, loadData } from '../code-builder/load-data.js';
import {
	generateContentMap,
	generatePageCode,
	generatePageImportCode,
	generateRoutesCode,
	VIRTUAL_PAGE_PREFIX
} from '../code-builder/load-content.js';
import { type ServerResponse } from 'node:http';
import { generateCollectionsImportsCode } from '../code-builder/collections.js';
import { generateHooksCode } from '../code-builder/hooks.js';
import { isCompileException } from '../utils/exceptions.js';
import { generateInternalStores, generateReadableStores } from '../code-builder/stores.js';
import assert from 'node:assert';
import { FileManager } from '../utils/FileManager.js';

const cwd = process.cwd(); // Current working directory
const cf = resolve(dirname(fileURLToPath(import.meta.url)), '..'); // core folder

const validateEmbodiId = prepareIdValidator('$embodi/');
const validatePageId = prepareIdValidator(VIRTUAL_PAGE_PREFIX);

export const configPlugin = (): Plugin => ({
	name: 'embodi-config-plugin',
	async config(config, env) {
		const projectConfig = await loadConfig(cwd);
		const ssr = env.isSsrBuild;
		const distBase = projectConfig.dist ?? 'dist';
		const newConfig: UserConfig = {
			...config,
			...projectConfig.viteConfig,
			root: cwd,
			resolve: {
				...config.resolve,
				alias: {
					'$embodi/*': resolve(cf, './virtual-modules/embodi/*'),
					$assets: resolve(cwd, projectConfig.inputDirs.assets),
					// $layout: resolve(cwd, projectConfig.inputDirs.layout)
				}
			},
			build: {
				target: 'ES2022',
				emptyOutDir: true,
				ssr,
				ssrManifest: !ssr,
				manifest: !ssr,
				outDir: ssr ? join(distBase, 'server') : join(distBase, 'static'),
				rollupOptions: {
					input: ssr
						? resolve(cf, '../app/entry-server.js')
						: { client: resolve(cf, '../app/entry-client.js') }
				}
			}
		};
		return newConfig;
	}
});

export const virtualPlugin = (): Plugin => ({
	name: 'embodi-virtual-plugin',
	async resolveId(id) {
		return resolvePipe(
			validatePageId.resolve(id),
			validateEmbodiId.resolve(
				id,
				'config',
				'pages',
				'paths',
				'data',
				'collections',
				'hooks',
				'env',
				'stores',
				'stores/internal'
			)
		);
	},
	async load(id, options) {
    if (validatePageId.load(id)) {
      const config = await loadConfig(cwd);
      const [pageMap, linkRef] = await generateContentMap(config.inputDirs);
      const pageCode = await generatePageCode(
        pageMap.map(({ data, ...page }) => ({ ...page, data: options?.ssr ? data : null })),
        linkRef,
        validatePageId.getPath(id)
      );
      return pageCode;
    } else if (validateEmbodiId.load(id, 'config')) {
      const config = await loadConfig(cwd);
      const { src, dest } = getSrcDestDirs(config);
      return `export const src = ${JSON.stringify(src)};\nexport const dest = ${JSON.stringify(dest)};`
		} else if (validateEmbodiId.load(id, 'pages')) {
			const config = await loadConfig(cwd);
			const contentMap = await generateContentMap(config.inputDirs);
			const pagesCode = await generatePageImportCode(...contentMap);
			const routesCode = await generateRoutesCode(config.inputDirs);
			return `${pagesCode}\n${routesCode}\nexport const source = "${config.inputDirs.content}";export const VIRTUAL_PREFIX = "${VIRTUAL_PAGE_PREFIX}";`;
		} else if (validateEmbodiId.load(id, 'paths')) {
			const { statics } = await loadConfig(cwd);
			const relativPathToClientEntry = relative(cwd, resolve(cf, '../app/entry-client.js'));

			return `export const entryClient = "${relativPathToClientEntry}"; export const statics = "${statics}";`;
		} else if (validateEmbodiId.load(id, 'data')) {
			const projectConfig = await loadConfig(cwd);

			const dataDirectoryPath = projectConfig.inputDirs.data;
			const data = await loadData(dataDirectoryPath);
			return `export const data = ${JSON.stringify(data)};`;
		} else if (validateEmbodiId.load(id, 'collections')) {
			storeLoadId('collections', id);
			const params = getVirtualParams(id);

			return await generateCollectionsImportsCode({
				...params,
				only: params.only ? params.only.split(';') : undefined
			});
		} else if (validateEmbodiId.load(id, 'hooks')) {
			return generateHooksCode();
		} else if (validateEmbodiId.load(id, 'env')) {
			return `export const browser = ${JSON.stringify(!options?.ssr)};`;
		} else if (validateEmbodiId.load(id, 'stores/internal')) {
			return generateInternalStores();
		} else if (validateEmbodiId.load(id, 'stores')) {
			return generateReadableStores('$embodi/stores/internal');
		}
	},
	async handleHotUpdate({ server, file }) {
		if (await isHotUpdate(file, 'data')) {
			await validateEmbodiId.invalidate(server, 'data');
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
				await validateEmbodiId.invalidate(server, 'pages');
				await validateEmbodiId.invalidate(server, 'paths');
			}
		});
	}
});

export const prerenderPlugin = (): Plugin => {
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
	};
};

export const devServerPlugin = (): Plugin => ({
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
		const fileManager = new FileManager({
		  head: `<script type="module" defer src="/node_modules/${packageJson.name}/dist/core/app/entry-client.js"></script>`
		});
		const devServer = async (
			req: Connect.IncomingMessage,
			res: ServerResponse,
			next: Connect.NextFunction
		) => {
			// TODO: add static file route here
			try {
				const { inputDirs, statics } = await loadConfig(cwd);
				let url = req.originalUrl;
        assert(url);
        if(fileManager.has(url)) {
          const data = fileManager.getFile(url);
          return res.end(data);
        }

				const rawTemplate = await loadAppHtml(statics);
				const template = await server.transformIndexHtml(url, rawTemplate);
				fileManager.setTemplate(template)
				const { render } = await server.ssrLoadModule(
					`/node_modules/${packageJson.name}/dist/core/app/entry-server.js`
				);

				await render(url, fileManager);
				const html = fileManager.getPage(url)
				if(!html) {
          return next();
				}
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
			}
		};

		server.middlewares.use(devServer);
	}
});
