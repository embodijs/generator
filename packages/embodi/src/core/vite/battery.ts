import type { Plugin } from 'vite';

export function embodiBattery() {
	return {
		name: 'vite-embodi-battery',

		resolveId(id) {
			if (id.endsWith('.battery')) {
				return `\0${id}`;
			} else if (id.endsWith('.js.embodi') || id.endsWith('.ts.embodi')) {
				return `\0${id}`;
			}
		},
		load(id) {
			if (id.endsWith('.battery')) {
				return `import { laod } from '/${id.slice(0, -7)}';`;
			} else if (id.endsWith('.js.embodi') || id.endsWith('.ts.embodi')) {
				return `export * from '/${id.slice(2, -10)}.js';`;
			}
		}
	} satisfies Plugin;
}
