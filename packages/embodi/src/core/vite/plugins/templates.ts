import { type Plugin } from 'vite';
import { loadConfig, type EmbodiConfig } from '../utils/config.js';
import { prepareIdValidator, resolvePipe } from '../utils/virtuals.js';
import { existsSync } from 'fs';}
import { prepareComponentLoad } from '../utils/template.js';
import assert from 'assert';
import { resolve } from 'node:path';
import { join } from 'node:path/posix';


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

				const layoutPath = join('#root', layoutRoot, path);

				const snippet = `export { default as Layout} from '${layoutPath}';`;
        if (options?.ssr === true) {
         	const layoutExtendsPathJS = resolve(layoutRoot, path + '.js');
          const layoutExtendsPathTS = resolve(layoutRoot, path + '.ts');
          if (existsSync(layoutExtendsPathJS) || existsSync(layoutExtendsPathTS)) {
            return `${snippet}\n
  				export * as layoutActions from '${layoutPath}.js';
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
