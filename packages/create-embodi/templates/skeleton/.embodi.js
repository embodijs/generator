import { defineConfig } from 'embodi';
import embodiMarkdown from '@embodi/markdown';
import embodiHtml from '@embodi/html';

export default defineConfig({
  publicDir: './public',
  layoutDir: './__layout',
  source: '/content',
  plugins: [embodiMarkdown(), embodiHtml()]
});
