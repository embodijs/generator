import { createContentParserPlugin, type Plugin } from 'embodi/dev';

export function embodiHtml(): Plugin {
  return createContentParserPlugin({
    name: 'vite-embodi-html',
    fileType: 'html',
    convertContent: (content) => content
  });
}
