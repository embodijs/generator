import { type Plugin, type PluginTuple, type Preset, type Settings, unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import { createContentParserPlugin, type Plugin as VitePlugin } from 'embodi/dev';

interface MarkdownPluginOptions {
  remarkPlugins?: (Plugin | PluginTuple)[];
  rehypePlugins?: (Plugin | PluginTuple)[];
  settings?: Settings;
}

export function embodiMarkdown(options: MarkdownPluginOptions = {}): VitePlugin {
  const { remarkPlugins, rehypePlugins, settings } = options;

  const processor = unified().use({
    plugins: [remarkParse, ...(remarkPlugins || []), remarkRehype, ...(rehypePlugins || []), rehypeStringify],
    settings
  } satisfies Preset);

  return createContentParserPlugin({
    name: 'vite-embodi-markdown',
    fileType: 'md',
    convertContent: async (content) => {
      const html = await processor.process(content);
      return String(html);
    }
  });
}

export default embodiMarkdown;
