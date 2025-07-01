import { type Plugin, unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot } from 'hast';
import { createContentParserPlugin, type Plugin as VitePlugin } from 'embodi/dev';

type PluginWithOptions<T = any> = [Plugin<[T], MdastRoot>, T];
type PluginEntry<T = any> = Plugin<any[], MdastRoot> | PluginWithOptions<T>;

type RehypePluginWithOptions<T = any> = [Plugin<[T], HastRoot>, T];
type RehypePluginEntry<T = any> = Plugin<any[], HastRoot> | RehypePluginWithOptions<T>;

interface MarkdownPluginOptions {
  remarkPlugins?: PluginEntry[];
  rehypePlugins?: RehypePluginEntry[];
}

export function embodiMarkdown(options: MarkdownPluginOptions = {}): VitePlugin {
  const { remarkPlugins, rehypePlugins } = options;

  const processor = unified().use(remarkParse);

  remarkPlugins?.forEach((plugin) => (Array.isArray(plugin) ? processor.use(...plugin) : processor.use(plugin)));
  processor.use(remarkRehype);
  rehypePlugins?.forEach((plugin) => (Array.isArray(plugin) ? processor.use(...plugin) : processor.use(plugin)));
  processor.use(rehypeStringify);

  return createContentParserPlugin({
    name: 'vite-embodi-markdown',
    fileType: 'md',
    convertContent: (content) => String(processor.processSync(content))
  });
}

export default embodiMarkdown;
