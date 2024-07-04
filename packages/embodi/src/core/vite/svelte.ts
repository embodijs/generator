import type { Plugin } from 'vite';
import { resolve } from 'node:path';


export function embodiSvelte () {
	return ({
		name: 'vite-embodi-svelte',

		resolveId(id) {
			if(id.endsWith('.svelte.embodi')) {
				return `\0${id}`;
			}
		},
		load(id) {
			if(id.endsWith('.svelte.embodi')) {
				return `export { default as Component } from '${resolve(id.slice(2, -7))}';`
			}
		},
	}) satisfies Plugin;
}