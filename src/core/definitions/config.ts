import type { Plugin } from "vite";


export interface EmbodiBuildConfig {
	plugins: Array<Plugin[] | Plugin>;
}
export interface EmbodiConfig {
	statics: string;
	base: string;
	dist: string;
	source: string;
	build: EmbodiBuildConfig;
}