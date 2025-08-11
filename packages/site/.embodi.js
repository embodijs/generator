import { defineConfig } from 'embodi';
import tailwindcss from '@tailwindcss/vite';
import { embodiMarkdown } from '@embodi/markdown';

export default defineConfig({
  publicDir: './public',
  layoutDir: './__layout',
  source: '/content',
  plugins: [tailwindcss(), embodiMarkdown()]
});
