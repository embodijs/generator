import { type Plugin } from 'vite';
import { loadConfig, type EmbodiConfig } from '../utils/config.js';
import { prepareIdValidator, resolvePipe } from '../utils/virtuals.js';
import { loadLayouts } from '../utils/template.js';
import assert from 'assert';

export const templatePlugin = (): Plugin => {
	let cwd = process.cwd();
	let projectConfig: EmbodiConfig;
	let layoutValidator = prepareIdValidator('$layout/');

	return {
		name: 'vite-embodi-template-plugin',
		apply: 'build',
		async configResolved(config) {
			cwd = config.root;
			projectConfig = await loadConfig(cwd);
		},
		resolveId(id) {
			return resolvePipe(layoutValidator.resolve(id));
		},
		async load(id) {
			if (layoutValidator.load(id)) {
				assert(projectConfig);
				const layouts = await loadLayouts(cwd, projectConfig);
				if (!layouts)
					throw new Error(`No layouts found. Create a layouts config in the layouts directory.`);
				const path = layoutValidator.getPath(id);

				const layout = layouts[path];
				if (!layout) throw new Error(`Layout not found for id ${id}`);
				return `export default ${JSON.stringify(layout, (key, value) => (typeof value === 'function' ? value.toString() : value))}`;
			}
		}
	};
};
