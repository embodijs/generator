import { resolve } from 'path/win32';
import type { EmbodiUserConfig } from '../core/vite/utils/config.js';
import type { Layout } from '../core/vite/utils/template.js';

export const defineConfig = (config: EmbodiUserConfig): EmbodiUserConfig => config;
export const defineLayout = (layout: Layout): Layout => layout;
