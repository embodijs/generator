import type { Plugin } from 'vite';
import fm from 'front-matter';
import markdownIt from 'markdown-it';
import { loadConfig, type EmbodiConfig } from '../app/config.js';
import { resolve } from 'node:path';
import { isRelativePath } from '../utils/paths.js';
interface PageData {
	layout?: string;
	[key: string]: any;
}

const cwd = process.cwd();



export function embodiFrontMatter () {

	let embodiConfig: EmbodiConfig;

	return ({
		name: 'vite-embodi-front-matter',

		async config(config) {
			embodiConfig = await loadConfig(cwd);
			return config;
		},
		resolveId(id) {
			if(id.endsWith('.md.embodi')) {
				return `\0${id}`;
			}
		},
		load(id) {
			if(id.endsWith('.md.embodi')) {
				return `export * from '${resolve(id.slice(2, -7))}';`
			}
		},
		async transform(code, id) {
			if(id.endsWith('.md')) {
				//@ts-ignore
				const { attributes, body } = fm<PageData>(code);
				const { templatePrefix } = embodiConfig;

				const {layout} = attributes;
				let result = `export const data = ${JSON.stringify(attributes)}; export const html = ${JSON.stringify(markdownIt().render(body))};`
				if(layout ) {
					if(isRelativePath(templatePrefix)) {
						result = `import Layout from '${`${resolve(templatePrefix, `${layout}.svelte`)}`}'; export { Layout }; \n` + result;
					} else {
						result = `import Layout from '${`${templatePrefix}/${layout}.svelte`}'; export { Layout }; \n` + result;
					}
				}


				return {
					code: result,
					map: null,
				}
			}
		}
	}) satisfies Plugin;
}