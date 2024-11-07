import type { Plugin } from 'vite';

export function embodiBattery() {
	return {
		name: 'vite-embodi-svelte',

		resolveId(id) {
			if (id.endsWith('.battery')) {
				return `\0${id}`;
			}
		},
		load(id) {
			if (id.endsWith('.battery')) {
				return `import { laod } from '/${id.slice(0, -7)}';`;
			}
		}
	} satisfies Plugin;
}
