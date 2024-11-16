import { createServer, preview, defineConfig, type Plugin } from 'vite';
import { configPlugin, devServerPlugin, virtualPlugin } from './plugins/embodi.js';
import { embodiMarkdown } from './plugins/markdown.js';
import { embodiHtml } from './plugins/html.js';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { embodiSvelte } from './plugins/svelte.js';
import { loadConfig } from './utils/config.js';
import viteYaml from '@modyfi/vite-plugin-yaml';
import { embodiBattery } from './plugins/battery.js';

export const createConfig = async () => {
	const config = await loadConfig();
	const plugins: Array<Plugin | Plugin[]> = [
		viteYaml(),
		svelte({
			preprocess: vitePreprocess()
		}),
		configPlugin(),
		virtualPlugin(),
		embodiSvelte(),
		embodiMarkdown(),
		embodiHtml(),
		embodiBattery(),
		devServerPlugin(),
		...config.plugins
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
