import { createViteRuntime, createServer, preview , build, defineConfig, type Plugin } from 'vite';
import { configPlugin, devServerPlugin, previewServerPlugin, virtualPlugin } from './vite/embodi.js';
import { embodiFrontMatter } from './vite/front-matter.js';
import { svelte } from '@sveltejs/vite-plugin-svelte';


export const createConfig = (command: 'dev' | 'preview' | 'build') => {
	const plugins: Array<Plugin | Plugin[]> = [
		configPlugin(),
		virtualPlugin(),
		embodiFrontMatter(),
		svelte({
			compilerOptions: {
				hydratable: true
			}
		})
	];
	if(command === 'dev') {
		plugins.push(devServerPlugin())
	} else if(command === 'preview') {
		plugins.push(previewServerPlugin())
	}
	return defineConfig({
		plugins
	})
}

export const createDevServer = async () => {
	const config = await createConfig('dev');
	const server = await createServer(config);
	return server;
}

export const createPreviewServer = async () => {
	const config = await createConfig('preview');
	const server = await preview(config);
	server.printUrls()
	server.bindCLIShortcuts({ print: true })
	return server;
}