import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { configPlugin, prerenderPlugin, virtualPlugin } from './vite/embodi.js';
import { embodiMarkdown } from './vite/markdown.js';
import { embodiHtml } from './vite/html.js';
import { build as viteBuild, defineConfig, type Plugin } from 'vite';
import { embodiSvelte } from './vite/svelte.js';
import { loadConfig } from './app/config.js';
import viteYaml from '@modyfi/vite-plugin-yaml';
import { embodiBattery } from './vite/battery.js';

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
		prerenderPlugin(),
		...config.plugins
	];

	return defineConfig({
		plugins
	});
};

export const generate = async () => {
	const config = await createConfig();
	console.info('build client scripts...');
	await viteBuild({
		...config,
		build: {
			...config.build,
			ssrManifest: true
		}
	});
	console.info('build server scripts...');
	await viteBuild({
		...config,
		plugins: [...config.plugins!],
		build: {
			...config.build,
			ssr: true
		}
	});
};
