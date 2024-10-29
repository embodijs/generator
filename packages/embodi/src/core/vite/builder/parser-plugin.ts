import type { Plugin } from 'vite';
import fm from 'front-matter';
import { loadConfig, type EmbodiConfig } from '../../app/config.js';
import { resolve } from 'node:path';
import { isRelativePath } from '../../utils/paths.js';
interface PageData {
	layout?: string;
	[key: string]: any;
}

const cwd = process.cwd();

export interface ContentParserPluginConfig {
	name: string;
	fileType: string;
	convertContent: (content: string, data: unknown) => string;
}

export function createContentParserPlugin(config: ContentParserPluginConfig) {
	let embodiConfig: EmbodiConfig;
	const { name, fileType, convertContent } = config;
	const embodiFormat = `.${fileType}.embodi`;
	const format = `.${fileType}`;
	return {
		name,
		async buildStart() {
			embodiConfig = await loadConfig(cwd);
		},
		resolveId(id) {
			if (id.endsWith(embodiFormat)) {
				return `\0${id}`;
			}
		},
		load(id) {
			if (id.endsWith(embodiFormat)) {
				return `export * from '/${id.slice(2, -7)}';`;
			}
		},
		async transform(code, id) {
			if (id.endsWith(format)) {
				//@ts-ignore
				const { attributes, body } = fm<PageData>(code);
				const content = convertContent(body, attributes);
				const { templatePrefix } = embodiConfig;
				const { layout } = attributes;
				let result = `export const data = ${JSON.stringify(attributes)}; export const html = ${JSON.stringify(content)};`;
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
