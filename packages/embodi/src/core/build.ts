import { svelte } from "@sveltejs/vite-plugin-svelte";
import { configPlugin, prerenderPlugin, virtualPlugin } from "./vite/embodi.js";
import { embodiFrontMatter } from "./vite/front-matter.js";
import { build as viteBuild, defineConfig, type Plugin } from "vite";
import { prerender } from "./app/prerender.js";

export const createConfig = () => {
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

	return defineConfig({
		plugins
	})
}

export const generate = async () => {
	const config = createConfig();
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
		plugins: [
			...config.plugins!,
			prerenderPlugin()

		],
		build: {
			...config.build,
			ssr: true
		}
	});
	// console.info('prerendering...');
	// prerender();

}