import { type Plugin } from 'vite';
import { loadConfig, type EmbodiConfig } from '../utils/config.js';
import { prepareIdValidator, resolvePipe } from '../utils/virtuals.js';
import { prepareComponentLoad } from '../utils/template.js';
import assert from 'assert';

export const templatePlugin = (): Plugin => {
	let cwd = process.cwd();
	let projectConfig: EmbodiConfig;
	let layoutValidator = prepareIdValidator('$layout/');
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

				// const getLayoutPath = await prepareComponentLoad(cwd, projectConfig);
				// const layout = getLayoutPath(path);
				// if (!layout) throw new Error(`Layout not found for id ${id}`);
				// const layoutPath = join(cwd, layoutRoot, layout);
				const snippet = `export { default as Layout} from '$layout-internal/${path}';`;
				if (options?.ssr === true) {
					return `${snippet}\n
					export const loadLayoutActions = async () => {
					  try {
  						const layoutActions = await import('$layout-internal/${path}.js');
  						return layoutActions;
					  } catch (error) {
						  return {};
					  }
					};
					`;
				}
				return snippet;
			}
		}
	};
};
