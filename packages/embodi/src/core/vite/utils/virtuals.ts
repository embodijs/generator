import type { ViteDevServer } from "vite";

export const VIRTUAL_MODULE_PREFIX = "$embodi";
const VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_PREFIX}`;

export function validateResolveId(id: string, ...modules: string[]) {
	if (id.startsWith(VIRTUAL_MODULE_PREFIX) && modules.includes(id.slice(VIRTUAL_MODULE_PREFIX.length+1))) {
		return `\0${id}`;
	}
	return null;
}

export function isValidLoadId(id: string, ...modules: string[]) {
	return id.startsWith(VIRTUAL_MODULE_ID) && modules.includes(id.slice(VIRTUAL_MODULE_ID.length+1));
}

export function invalidateModule(server: ViteDevServer, module: string) {
	const virtualModule = server.moduleGraph.getModuleById(`${VIRTUAL_MODULE_ID}/${module}`);
	server.moduleGraph.invalidateModule(virtualModule!);
}
