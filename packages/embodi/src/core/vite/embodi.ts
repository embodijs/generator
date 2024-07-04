import { type Plugin, type UserConfig } from "vite";
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from "node:url";
import { relative } from "node:path";
import { loadConfig } from "../app/config.js";
import { prerender } from "../app/prerender.js";
import packageJson from "../../../package.json"  with { type: "json" };
import { invalidateModule, isValidLoadId, validateResolveId } from "./utils/virtuals.js";
import { loadAppHtml, loadData } from "./utils/load-data.js";
import { generatePageImportCode } from "./utils/load-content.js";

const cwd = process.cwd();
const cfd = dirname(fileURLToPath(import.meta.url));

export const configPlugin = () => ({
		name: "embodi-config-plugin",
		async config(config, env) {
			const projectConfig = await loadConfig(cwd);
			const ssr = env.isSsrBuild;
			const distBase = projectConfig.dist ?? "dist";
			const newConfig: UserConfig = {
				...config,
				base: projectConfig.base,
				root: cwd,
				plugins: [
					...config.plugins ?? [],
					...projectConfig.plugins ?? []
				],
				resolve: {
					alias: {
						'$embodi/*': resolve(cfd, "./virtual-modules/embodi/*")
					}
				},
				build: {
					emptyOutDir: true,
					ssr,
					ssrManifest: !ssr,
					manifest: !ssr,
					outDir: ssr ? join(distBase, 'server') : join(distBase, 'static'),
					rollupOptions: {
						input: ssr ? resolve(cfd, "../app/entry-server.js") : {client: resolve(cfd, "../app/entry-client.js")}
					}
				}
			}
			return newConfig;
		},
	}) satisfies Plugin

	export const virtualPlugin = () => ({
		name: "embodi-virtual-plugin",
		async resolveId(id) {
			return validateResolveId(id, "pages", "paths", "data");
		},
		async load(id) {

			if(isValidLoadId(id, "pages")) {
				const {source} = await loadConfig(cwd);
				const pagesString = await generatePageImportCode(source);
				return `${pagesString}\nexport const source = "${source}";`
			} else if(isValidLoadId(id, "paths")) {
				const { statics } = await loadConfig(cwd);
				const relativPathToClientEntry = relative(cwd, resolve(cfd, "../app/entry-client.js"));

				return `export const entryClient = "${relativPathToClientEntry}"; export const statics = "${statics}";`
			} else if(isValidLoadId(id, "data")) {
				const projectConfig = await loadConfig(cwd);

				const dataDirectoryPath = projectConfig.dataDir;
				const data = await loadData(dataDirectoryPath);
				return `export const data = ${JSON.stringify(data)};`;
			}
		},
		async handleHotUpdate({server, file, timestamp}) {
			const projectConfig = await loadConfig(cwd);

			if(file.startsWith(resolve(cwd, projectConfig.dataDir))) {

				invalidateModule(server, "data");
				server.ws.send({
					type: 'full-reload'
				})
			}

		}
	}) satisfies Plugin;


	export const prerenderPlugin = () => {
		let isSsr = false;
		return ({
			name: "embodi-prerender-plugin",

			configResolved(config) {
				isSsr = !!config.build.ssr;
			},

			async writeBundle() {
				if(!isSsr) {
					return;
				}
				const {source, statics} = await loadConfig(cwd);
				await prerender({
					source,
					statics
				});
			}
		}) satisfies Plugin;
	}

	export const devServerPlugin = () => ({
		name: "embodi-dev-server-plugin",

		config(config) {
			return {
				...config,
				server: {
					...config.server,
					hmr: true
				}
			}
		},
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				// TODO: add static file route here
				const {source, statics} = await loadConfig(cwd);

				const template = await loadAppHtml(statics);
				const linkToClient = `<script type="module" defer src="/node_modules/${packageJson.name}/dist/core/app/entry-client.js"></script>`;
				const { render } = await server.ssrLoadModule(`/node_modules/${packageJson.name}/dist/core/app/entry-server.js`);

				const rendered = await render(source, req.originalUrl);
				if(!rendered) {
					return next();
				}

				const html = template
					.replace(`<!--app-head-->`, (rendered.head ?? '') + linkToClient)
					.replace(`<!--app-html-->`, rendered.html ?? '')
				res.writeHead(200, {
					"Content-Type": "text/html",
					'Content-Length': html.length
				})
				return res.end(html);
			})
		},

	}) satisfies Plugin;

