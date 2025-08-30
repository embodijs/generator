import { defineConfig } from 'embodi/config';
import { embodiMarkdown } from '@embodi/markdown';
import { embodiHtml } from '@embodi/html';

export default defineConfig({
  publicDir: './public',
  plugins: [embodiMarkdown(), embodiHtml()],
  layoutDir: './__layout',
  source: '/content'
});
