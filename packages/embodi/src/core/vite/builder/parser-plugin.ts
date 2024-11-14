import type { Plugin } from 'vite';
import fm from 'front-matter';
import { normalize } from 'node:path';
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
	const { name, fileType, convertContent } = config;
	const embodiFormat = `.${fileType}.embodi`;
	const format = `.${fileType}`;
	return {
		name,
		resolveId(id) {
			if (id.endsWith(embodiFormat)) {
				if(id.startsWith('\0')) {
					return id;
				}
				return `\0${id}`;
			}
		},
		load(id) {
			if (id.endsWith(embodiFormat)) {
				return `export * from '${id.slice(1, -7)}';`;
			}
		},
		async transform(code, id) {
			if (id.endsWith(format)) {
				//@ts-ignore
				const { attributes, body } = fm<PageData>(code);
				const content = convertContent(body, attributes);
				const { layout } = attributes;
				let result = `export const data = ${JSON.stringify(attributes)}; export const html = ${JSON.stringify(content)};`;
				if (layout) {
					result = `export { default as Layout } from '${layout}';\n` + result;
				}

				return {
					code: result,
					map: null
				};
			}
		}
	} satisfies Plugin;
}

