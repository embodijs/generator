import { defineConfig } from 'embodi/config';
import { embodiMarkdown } from '@embodi/markdown';

export default defineConfig({
  publicDir: './public',
  plugins: [embodiMarkdown()],
  layoutDir: './__layout',
  source: '/content'
});
