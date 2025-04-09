import { join } from 'path';
import { loadConfig, type PublicDirs } from '../utils/config.js';
import type { ViteDevServer } from 'vite';

const LOAD_ID_PREFIX = `\0`;

const loadIdStorage: Record<string, Set<string>> = {};

export function getIdWithoutParams(id: string) {
	return id.split('?')[0];
}

export function getVirtualParams(id: string): { [key: string]: string } {
	const [, params] = id.split('?');
	if (!params) {
		return {};
	}
	return Object.fromEntries(new URLSearchParams(params).entries());
}

export const prepareResolveIdValidator =
	(prefix: string) =>
	(id: string, ...modules: string[]) => {
		const moduleName = getIdWithoutParams(id);
		if (
			moduleName.startsWith(prefix) &&
			(modules.length === 0 || modules.includes(moduleName.slice(prefix.length)))
		) {
			return `${LOAD_ID_PREFIX}${id}`;
		}
		return null;
	};

export const resolvePipe = (
	...validated: ReturnType<ReturnType<typeof prepareResolveIdValidator>>[]
): string | null => validated.find((validated) => validated != null) ?? null;

export const prepareLoadIdValidator =
	(prefix: string) =>
	(id: string, ...modules: string[]) => {
		const moduleName = getIdWithoutParams(id);
		const fullModulePrefix = `${LOAD_ID_PREFIX}${prefix}`;
		return (
			moduleName.startsWith(fullModulePrefix) &&
			(modules.length === 0 || modules.includes(moduleName.slice(fullModulePrefix.length)))
		);
	};

export const prepareGetPath =
	(prefix: string) =>
	(id: string, ...modules: string[]) => {
		if (id.startsWith(LOAD_ID_PREFIX)) {
			return id.slice(prefix.length + LOAD_ID_PREFIX.length);
		} else {
			return id.slice(prefix.length);
		}
	};

export async function storeLoadId(collection: string, id: string) {
	if (!loadIdStorage[collection]) {
		loadIdStorage[collection] = new Set();
	}
	loadIdStorage[collection].add(id);
}

export async function invalidateStoredCollection(server: ViteDevServer, collection: string) {
	const ids = loadIdStorage[collection];
	if (ids) {
		for (const id of ids) {
			invalidateModule(server, id);
		}
	}
}

export async function invalidateModule(server: ViteDevServer, module: string) {
	const virtualModule = await server.moduleGraph.getModuleByUrl(module);
	if (virtualModule) {
		server.moduleGraph.invalidateModule(virtualModule);
	}
}

export const prepareInvalidateModule =
	(prefix: string) => async (server: ViteDevServer, module: string) => {
		invalidateModule(server, `${LOAD_ID_PREFIX}${prefix}${module}`);
	};

export async function isHotUpdate(id: string, publicDir: keyof PublicDirs) {
	const cwd = process.cwd();
	const { inputDirs } = await loadConfig(cwd);
	const path = inputDirs[publicDir];
	if (!path) {
		return false;
	}
	return id.startsWith(join(cwd, path));
}

export function getUniqueAttributeName(prefix: string = 'u') {
	const unique = crypto.randomUUID();
	const uniqueName = unique.replaceAll('-', '_');
	return `${prefix}${uniqueName}`;
}

export const prepareIdValidator = (prefix: string) => ({
	resolve: prepareResolveIdValidator(prefix),
	load: prepareLoadIdValidator(prefix),
	invalidate: prepareInvalidateModule(prefix),
	getPath: prepareGetPath(prefix)
});

export const importCodeString = (code: string) =>
	import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
