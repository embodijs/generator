import type { Plugin } from 'vite';

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
				return `export { default as Component } from '/${id.slice(2, -7)}';`;
			}
		}
	};
}
