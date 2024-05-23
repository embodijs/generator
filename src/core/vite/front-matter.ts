import type { Plugin } from 'vite';
import fm from 'front-matter';
import markdownIt from 'markdown-it';
import { loadConfig } from '../app/config.js';
import type { EmbodiConfig } from 'core/definitions/config.js';

interface PageData {
	layout?: string;
	[key: string]: any;
}

const cwd = process.cwd();

export function embodiFrontMatter () {

	let embodiConfig: EmbodiConfig;

	return ({
		name: 'vite-embodi-front-matter',

		async config(config, env) {
			embodiConfig = await loadConfig(cwd);
			return config;
		},
		async transform(code, id) {
			if(id.endsWith('.md')) {
				//@ts-ignore
				const { attributes, body } = fm<PageData>(code);
				const {layout} = attributes;
				let result = `export const data = ${JSON.stringify(attributes)}; export const content = ${JSON.stringify(markdownIt().render(body))};`
				if(layout ) {
					result = `import Component from '${`${embodiConfig.templatePrefix}/${layout}.svelte`}'; export { Component }; \n` + result;
				}


				return {
					code: result,
					map: null,
				}
			}
		}
	}) satisfies Plugin;
}