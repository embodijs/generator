import { type Plugin } from 'vite';
import { loadConfig, type EmbodiConfig } from '../utils/config.js';
import { prepareIdValidator, resolvePipe } from '../utils/virtuals.js';
import { existsSync } from 'fs';}
import { prepareComponentLoad } from '../utils/template.js';
import assert from 'assert';
import { posix } from 'node:path';

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

				const layoutPath = posix.resolve(cwd, layoutRoot, path);
				const layoutExtendsPathJS = posix.resolve(cwd, layoutRoot, path + '.js');
				const layoutExtendsPathTS = posix.resolve(cwd, layoutRoot, path + '.ts');
				const snippet = `export { default as Layout} from '${layoutPath}';`;
        if (options?.ssr === true) {
          if (existsSync(layoutExtendsPathJS) || existsSync(layoutExtendsPathTS)) {
            return `${snippet}\n
  				export * as layoutActions from '${layoutExtendsPathJS}';
  				`
          } else {
            return `${snippet}\n
  				export const layoutActions = {};
  				`
          }
        }
				return snippet;
			}
		}
	};
};
