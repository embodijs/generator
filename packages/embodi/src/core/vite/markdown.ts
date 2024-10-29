import type { Plugin } from 'vite';
import markdownIt from 'markdown-it';
import { createContentParserPlugin } from './builder/parser-plugin.js';

export function embodiMarkdown(): Plugin {
	return createContentParserPlugin({
		name: 'vite-embodi-markdown',
		fileType: 'md',
		convertContent: (content) => markdownIt().render(content)
	});
}
