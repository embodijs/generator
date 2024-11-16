export { createDevServer, createPreviewServer } from '../core/vite/dev.js';
export { generate } from '../core/vite/build.js';
export { defineConfig } from '../core/vite/utils/config.js';

export type {
	RenderHookEvent,
	RenderHook,
	LoadAction,
	LoadEvent
} from '../core/definitions/types.js';
