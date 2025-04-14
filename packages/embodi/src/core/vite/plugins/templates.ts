import { type Plugin } from 'vite';
import { loadConfig, type EmbodiConfig } from '../utils/config.js';
import { prepareIdValidator, resolvePipe } from '../utils/virtuals.js';
import { prepareComponentLoad } from '../utils/template.js';
import assert from 'assert';
import { join } from 'path/posix';

export const templatePlugin = (): Plugin => {
	let cwd = process.cwd();
	let projectConfig: EmbodiConfig;
	let layoutValidator = prepareIdValidator('$layout2/');
	return {
		name: 'vite-embodi-template-plugin',
		async configResolved(config) {
			cwd = config.root;
			projectConfig = await loadConfig(cwd);
		},
		resolveId(id) {
			return resolvePipe(layoutValidator.resolve(id));
		},
		async load(id, options) {
			if (layoutValidator.load(id)) {
				assert(projectConfig);
				const layoutRoot = projectConfig.inputDirs.layout;
				const path = layoutValidator.getPath(id);

				const getLayoutPath = await prepareComponentLoad(cwd, projectConfig);
				const layout = getLayoutPath(path);
				if (!layout) throw new Error(`Layout not found for id ${id}`);
				const snippet = `export { default as Layout} from '${join(cwd, layoutRoot, layout)}';`;
				if (options?.ssr) {
					return `${snippet}\n
					import { layouts } from '${join(cwd, layoutRoot, './layout.config.js')}';
					export const schema = layouts['${path}'].schema;`;
				}
				return snippet;
			}
		}
	};
};
