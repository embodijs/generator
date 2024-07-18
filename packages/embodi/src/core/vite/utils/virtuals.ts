import { join } from "path";
import { loadConfig, type PublicDirs } from "../../app/config.js";
import type { ViteDevServer } from "vite";

export const VIRTUAL_MODULE_PREFIX = "$embodi";
const VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_PREFIX}`;


export function getIdWithoutParams(id: string) {
	return id.split('?')[0];
}

export function getVirtualParams(id: string): { [key: string]: string } {
	const [, params] = id.split('?');
	if(!params) {
		return {};
	}
	return Object.fromEntries(Object.entries(new URLSearchParams(params)));
}

export function validateResolveId(id: string, ...modules: string[]) {
	const moduleName = getIdWithoutParams(id);
	if (moduleName.startsWith(VIRTUAL_MODULE_PREFIX) && modules.includes(moduleName.slice(VIRTUAL_MODULE_PREFIX.length+1))) {
		return `\0${id}`;
	}
	return null;
}

export function isValidLoadId(id: string, ...modules: string[]) {
	const moduleName = getIdWithoutParams(id);
	return moduleName.startsWith(VIRTUAL_MODULE_ID) && modules.includes(moduleName.slice(VIRTUAL_MODULE_ID.length+1));
}

export function invalidateModule(server: ViteDevServer, module: string) {
	const virtualModule = server.moduleGraph.getModuleById(`${VIRTUAL_MODULE_ID}/${module}`);
	if(virtualModule) {
		server.moduleGraph.invalidateModule(virtualModule);
	}
}

export async function isHotUpdate(id: string, publicDir: keyof PublicDirs) {
	const cwd = process.cwd();
	const { inputDirs } = await loadConfig(cwd)
	const path = inputDirs[publicDir];
	if(!path) {
		return false;
	}
	return id.startsWith(join(cwd, path));
}


export function getUniqueAttributeName(prefix: string = "u") {
	const unique = crypto.randomUUID();
	const uniqueName = unique.replaceAll("-", "_");
	return `${prefix}${uniqueName}`;
}