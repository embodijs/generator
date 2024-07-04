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

		async config(config) {
			embodiConfig = await loadConfig(cwd);
			return config;
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