import { defineConfig } from 'embodi';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  publicDir: './public',
  layoutDir: './__layout',
  source: '/content',
  plugins: [tailwindcss()]
});
