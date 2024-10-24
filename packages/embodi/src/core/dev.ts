import { createServer, preview, defineConfig, type Plugin } from 'vite';
import { configPlugin, devServerPlugin, virtualPlugin } from './vite/embodi.js';
import { embodiFrontMatter } from './vite/front-matter.js';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { embodiSvelte } from './vite/svelte.js';

export const createConfig = () => {
	const plugins: Array<Plugin | Plugin[]> = [
		svelte({
			preprocess: vitePreprocess()
		}),
		configPlugin(),
		virtualPlugin(),
		embodiSvelte(),
		embodiFrontMatter(),
		devServerPlugin()
	];

	return defineConfig({
		plugins
	});
};

export const createDevServer = async () => {
	const config = await createConfig();
	const server = await createServer(config);
	return server;
};

export const createPreviewServer = async () => {
	const config = await createConfig();
	const server = await preview(config);
	server.printUrls();
	server.bindCLIShortcuts({ print: true });
	return server;
};
