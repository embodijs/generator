import { defineConfig } from 'embodi';
import tailwindcss from '@tailwindcss/vite';
import { embodiMarkdown } from '@embodi/markdown';

export default defineConfig({
  publicDir: './public',
  layoutDir: './__layout',
  plugins: [embodiMarkdown()],
  source: '/content',
  plugins: [tailwindcss()]
});
