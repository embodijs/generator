import type { Plugin as VitePlugin } from "vite";
export interface EmbodiConfig {
	statics: string;
	base: string;
	dist: string;
	source: `/${string}`;
	templatePrefix: string;
	publicDir: string;
	plugins: VitePlugin[];
}