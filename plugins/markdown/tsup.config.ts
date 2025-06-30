import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/markdown.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['esm', 'cjs']
});
