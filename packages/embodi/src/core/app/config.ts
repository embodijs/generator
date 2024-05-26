import type { EmbodiConfig } from "../definitions/config.js";
import { join } from "node:path";

export const defineConfig = (config: EmbodiConfig): EmbodiConfig => {

	const mixedConfig = {
		statics: config.statics ? config.statics : "",
		base: config.base ? config.base : "/",
		dist: config.dist ? config.dist : "dist",
		source: config.source ? config.source : "",
		build: {
			plugins: config.build?.plugins ?? []
		},
		templatePrefix: config.templatePrefix ? config.templatePrefix : "./__layout",
	};

	return mixedConfig;
}

export const loadConfig = async (cwd: string): Promise<EmbodiConfig> => {
	const config = await import(join(cwd, "embodi.config.js"));
	return config.default;
}