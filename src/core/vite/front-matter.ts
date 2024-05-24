import type { Plugin } from 'vite';
import fm from 'front-matter';
import markdownIt from 'markdown-it';
import { loadConfig } from '../app/config.js';
import type { EmbodiConfig } from 'core/definitions/config.js';
import { resolve } from 'node:path';

interface PageData {
	layout?: string;
	[key: string]: any;
}

const cwd = process.cwd();

function isRelativePath(path: string) {
	return path.startsWith('./') || path.startsWith('../');
}

export function embodiFrontMatter () {

	let embodiConfig: EmbodiConfig;

	return ({
		name: 'vite-embodi-front-matter',

		async config(config, env) {
			embodiConfig = await loadConfig(cwd);
			return config;
		},
		async resolveId(id) {
			if (id.startsWith('$template')) {
				const { templatePrefix } = embodiConfig;
				if(isRelativePath(templatePrefix)){
					return id.replace('$template', resolve(templatePrefix));
				}
				return id.replace('$template', templatePrefix);
			}
		},

		async transform(code, id) {
			if(id.endsWith('.md')) {
				//@ts-ignore
				const { attributes, body } = fm<PageData>(code);
				const {layout} = attributes;
				let result = `export const data = ${JSON.stringify(attributes)}; export const content = ${JSON.stringify(markdownIt().render(body))};`
				if(layout ) {
					result = `import Component from '${`$template/${layout}.svelte`}'; export { Component }; \n` + result;
				}


				return {
					code: result,
					map: null,
				}
			}
		}
	}) satisfies Plugin;
}