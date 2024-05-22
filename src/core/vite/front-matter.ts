import type { Plugin } from 'vite';
import fm from 'front-matter';
import markdownIt from 'markdown-it';

interface PageData {
	layout?: string;
	[key: string]: any;
}

const cwd = process.cwd();

export function embodiFrontMatter () {

	return ({
		name: 'vite-embodi-front-matter',
		transform(code, id) {
			if(id.endsWith('.md')) {
				//@ts-ignore
				const { attributes, body } = fm<PageData>(code);
				const {layout} = attributes;
				let result = `export const data = ${JSON.stringify(attributes)}; export const content = ${JSON.stringify(markdownIt().render(body))};`
				if(layout ) {
					//if(fs.existsSync(resolve(cwd, `src/lib/__layout/${layout}.svelte`))) {
						result = `import Component from '${`@embodi/compiler-components/${layout}.svelte`}'; export { Component }; \n` + result;
					//}
				}


				return {
					code: result,
					map: null,
				}
			}
		}
	}) satisfies Plugin;
}