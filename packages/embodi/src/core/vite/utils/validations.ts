export const VIRTUAL_MODULE_PREFIX = "$embodi";
const VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_PREFIX}`;

export function validateResolveId(id: string, ...types: string[]) {
	if (id.startsWith(VIRTUAL_MODULE_PREFIX) && types.includes(id.slice(VIRTUAL_MODULE_PREFIX.length+1))) {
		return `\0${id}`;
	}
	return null;
}

export function isValidLoadId(id: string, ...types: string[]) {
	return id.startsWith(VIRTUAL_MODULE_ID) && types.includes(id.slice(VIRTUAL_MODULE_ID.length+1));
}
