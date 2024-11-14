import { normalize } from 'node:path';
import type { Plugin } from 'vite';


const normalizeImportPath = (path: string) => normalize(path).replaceAll('\\', '\\\\');

export function embodiBattery() {
	return {
		name: 'vite-embodi-battery',

		resolveId(id) {
			if (id.endsWith('.js.embodi') || id.endsWith('.ts.embodi')) {
				if(id.startsWith('\0')) return id;
				return `\0${id}`;
			}
		},
		load(id) {
			 if (id.endsWith('.js.embodi') || id.endsWith('.ts.embodi')) {
				console.log('id', id, `export * from '${normalizeImportPath(id.slice(1, -10))}';`);
				return `export * from '${normalizeImportPath(id.slice(1, -10))}';`;
			}
		}
	} satisfies Plugin;
}
