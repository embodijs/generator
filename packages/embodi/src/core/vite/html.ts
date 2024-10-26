import type { Plugin } from 'vite';
import fm from 'front-matter';
import { loadConfig, type EmbodiConfig } from '../app/config.js';
import { resolve } from 'node:path';
import { isRelativePath } from '../utils/paths.js';
interface PageData {
	layout?: string;
	[key: string]: any;
}

const cwd = process.cwd();

export function embodiHtml() {
	let embodiConfig: EmbodiConfig;

	return {
		name: 'vite-embodi-front-matter',
		async config(config) {
			embodiConfig = await loadConfig(cwd);
			return config;
		},
		resolveId(id) {
			if (id.endsWith('.html.embodi')) {
				return `\0${id}`;
			}
		},
		load(id) {
			if (id.endsWith('.html.embodi')) {
				return `export * from '/${id.slice(2, -7)}';`;
			}
		},
		async transform(code, id) {
			if (id.endsWith('.html')) {
				//@ts-ignore
				const { attributes, body } = fm<PageData>(code);
				const { templatePrefix } = embodiConfig;
				console.log(body, attributes);

				const { layout } = attributes;
				let result = `export const data = ${JSON.stringify(attributes)}; export const html = ${JSON.stringify(body)};`;
				if (layout) {
					if (isRelativePath(templatePrefix)) {
						result =
							`import Layout from '${`${resolve(templatePrefix, `${layout}.svelte`)}`}'; export { Layout }; \n` +
							result;
					} else {
						result =
							`import Layout from '${`${templatePrefix}/${layout}.svelte`}'; export { Layout }; \n` +
							result;
					}
				}

				return {
					code: result,
					map: null
				};
			}
		}
	} satisfies Plugin;
}
