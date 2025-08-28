import { type Plugin } from 'vite';
import { loadConfig, type EmbodiConfig } from '../utils/config.js';
import { prepareIdValidator } from '../utils/virtuals.js';
import { existsSync } from 'fs';
import assert from 'assert';
import { resolve } from 'node:path';
import { join, extname } from 'node:path/posix';

const convertTo = (path: string) => {
	const ext = extname(path);
	if (ext === '') {
		throw new Error('Invalid layout path: Path need to include a file type');
	}
	return path.replace(ext, `.js?ext=${ext}`);
};

const convertFrom = (path: string) => {
	const [_path, searchQuery] = path.split('?');
	const originalFileType = searchQuery?.split('=')[1];
	const ext = extname(_path);
	return _path.replace(ext, originalFileType);
};

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
			const resolvedId = layoutValidator.resolve(id);
			if (resolvedId) {
				return convertTo(resolvedId);
			}
			return null;
		},
		async load(id, options) {
			if (layoutValidator.load(id)) {
				assert(projectConfig);
				const path = convertFrom(layoutValidator.getPath(id));
				const layoutRoot = projectConfig.inputDirs.layout;
				const layoutPath = join('#root', layoutRoot, path);

				const snippet = `export { default as Layout} from '${layoutPath}';`;
				if (options?.ssr === true) {
					const layoutExtendsPathJS = resolve(layoutRoot, path + '.js');
					const layoutExtendsPathTS = resolve(layoutRoot, path + '.ts');
					if (existsSync(layoutExtendsPathJS) || existsSync(layoutExtendsPathTS)) {
						return `${snippet}\n
  				export * as layoutActions from '${layoutPath}.js';
  				`;
					} else {
						return `${snippet}\n
  				export const layoutActions = {};
  				`;
					}
				}
				return snippet;
			}
		}
	};
};
