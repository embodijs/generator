import type { Plugin } from 'vite';

const normalizeImportPath = (path: string) => normalize(path).replaceAll('\\', '\\\\');

export function embodiSvelte(): Plugin {
	return {
		name: 'vite-embodi-svelte',

		resolveId(id) {
			if (id.endsWith('.svelte.embodi')) {
				return `\0${id}`;
			}
		},
		load(id) {
			if (id.endsWith('.svelte.embodi')) {
				return `export { default as Component } from '${normalizeImportPath(id.slice(1, -7))}';`;
			}
		}
	};
}
