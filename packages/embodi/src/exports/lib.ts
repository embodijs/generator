export { createDevServer, createPreviewServer } from '../core/vite/dev.js';
export { generate } from '../core/vite/build.js';

import type { EmbodiUserConfig } from '../core/vite/utils/config.js';
export const defineConfig = (config: EmbodiUserConfig): EmbodiUserConfig => config;

export type {
	RenderHookEvent,
	RenderHook,
	LoadAction,
	LoadEvent
} from '../core/definitions/types.js';
