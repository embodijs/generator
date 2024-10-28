import type { Plugin } from 'vite';
import { createContentParserPlugin } from './builder/parser-plugin.js';

export function embodiHtml(): Plugin {
	return createContentParserPlugin({
		name: 'vite-embodi-html',
		fileType: 'html',
		convertContent: (content) => content
	});
}
