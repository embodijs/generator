import { join } from "path";
import { loadConfig, type PublicDirs } from "../../app/config.js";
import type { ViteDevServer } from "vite";

export const VIRTUAL_MODULE_PREFIX = "$embodi";
const VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_PREFIX}`;

const loadIdStorage: Record<string, Set<string>> = {}

export function getIdWithoutParams(id: string) {
	return id.split('?')[0];
}

export function getVirtualParams(id: string): { [key: string]: string } {
	const [, params] = id.split('?');
	if(!params) {
		return {};
	}
	return Object.fromEntries((new URLSearchParams(params)).entries());
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
export async function storeLoadId(collection: string, id: string) {
	if(!loadIdStorage[collection]) {
		loadIdStorage[collection] = new Set();
	}
	loadIdStorage[collection].add(id);
}

export async function invalidateStoredCollection(server: ViteDevServer, collection: string) {
	const ids = loadIdStorage[collection];
	if(ids) {
		for(const id of ids) {
			invalidateModule(server, id);
		}
	}

}

export async function invalidateModule(server: ViteDevServer, module: string) {
	const virtualModule = await server.moduleGraph.getModuleByUrl(module);
	if(virtualModule) {
		server.moduleGraph.invalidateModule(virtualModule);
	}
}

export async function invalidateEmbodiModule(server: ViteDevServer, module: string) {
	invalidateModule(server, `${VIRTUAL_MODULE_ID}/${module}`);
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