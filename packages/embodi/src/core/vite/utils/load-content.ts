import type { Directory, LoomFile } from '@loom-io/core';
import { adapter, frontMatterConverter } from './project-adapter.js';
import { type PublicDirs } from '../../app/config.js';
import { addTrailingSlash } from '../../utils/paths.js';

export const transformPathToUrl = (dir: Directory, file: LoomFile) => {
	const { extension } = file;
	if (!extension) {
		throw new Error(`File ${file.path} has no extension`);
	}

	if (file.getNameWithoutExtension() === 'index') {
		return addTrailingSlash(`/${dir.relativePath(file.dir) ?? ''}`);
	}
	const relativePath = dir.relativePath(file)!;
	return addTrailingSlash(`/${relativePath.slice(0, -(extension.length + 1))}`);
};

const wrapperPath = (path: string) => `${path}.embodi`;
const wrapperImportFunctionString = (name: string, path: string) =>
	`"${name}": () => import('${wrapperPath(path)}')`;
const wrapperObject = (imports: string[]) => `({${imports.join(',')}})`;
const wrapperExport = (name: string, content: string) => `export const ${name} = ${content}`;

export const getAllPages = async (publicDirs: PublicDirs) => {
	const { content } = publicDirs;
	const dir = adapter.dir(content);
	const files = await dir.files(true);

	return {
		map: <T>(fn: (file: LoomFile, dir: Directory) => T) => {
			return files.asArray().map((file) => fn(file, dir));
		},
		asArray: () => files.asArray(),
		getDir: () => dir,
		getList: () => files
	};
};

export const getPageImportPath = (file: LoomFile) => wrapperPath(adapter.getFullPath(file));

export const loadPageData = async (file: LoomFile) => {
	const { data } = await frontMatterConverter.parse(file);
	if (!data || Object.keys(data).length === 0) {
		return undefined;
	}
	return data;
};

export const generatePageImportCode = async (publicDirs: PublicDirs) => {
	const importFunctions = (await getAllPages(publicDirs)).map((file, dir) => {
		const url = transformPathToUrl(dir, file);
		return wrapperImportFunctionString(url, adapter.getFullPath(file));
	});
	return wrapperExport('pages', wrapperObject(importFunctions));
};

export const getRoutesToPrerender = async (publicDirs: PublicDirs) => {
	return (await getAllPages(publicDirs)).map((file, dir) => transformPathToUrl(dir, file));
};
