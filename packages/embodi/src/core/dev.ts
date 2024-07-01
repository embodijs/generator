import { createServer, preview, defineConfig, type Plugin } from 'vite';
import { configPlugin, devServerPlugin, virtualPlugin } from './vite/embodi.js';
import { embodiFrontMatter } from './vite/front-matter.js';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';


export const createConfig = () => {
	const plugins: Array<Plugin | Plugin[]> = [
		configPlugin(),
		virtualPlugin(),
		embodiFrontMatter(),
		svelte({
			preprocess: vitePreprocess(),
			compilerOptions: {
				hydratable: true
			}
		}),
		devServerPlugin()
	];

	return defineConfig({
		plugins
	})
}

export const createDevServer = async () => {
	const config = await createConfig();
	const server = await createServer(config);
	return server;
}

export const createPreviewServer = async () => {
	const config = await createConfig();
	const server = await preview(config);
	server.printUrls()
	server.bindCLIShortcuts({ print: true })
	return server;
}