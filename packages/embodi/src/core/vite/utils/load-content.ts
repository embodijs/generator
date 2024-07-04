import type { Directory, LoomFile } from "@loom-io/core";
import { adapter } from "./project-adapter.js"


export const transformPathToUrl = (dir: Directory, file: LoomFile) => {

	const { extension } = file;
	if(!extension) {
		throw new Error(`File ${file.path} has no extension`);
	}
	if(file.getNameWithoutExtension() === 'index') {
		return dir.relativePath(file.dir) ?? '/';
	}
	const relativePath = dir.relativePath(file)!;
	return `/${relativePath.slice(0, -(extension.length+1))}`;
}

const wrapperPath = (path: string) => `${path}.embodi`;
const wrapperUrlPath = (name: string, path: string) => `"${name}": "${wrapperPath(path)}"`;
const wrapperImportFunctionString = (name: string, path: string) => `"${name}": () => import('${wrapperPath(path)}')`;
const wrapperObject = (imports: string[]) => `({${imports.join(',')}})`;
const wrapperExport = (name: string, content: string) => `export const ${name} = ${content}`;

export const getAllFiles = (contentPath: string) => ({ map: async (fn: (file: LoomFile, dir: Directory) => any) => {
	const dir = adapter.dir(contentPath);
	const files = await dir.files(true);
	return files.asArray().map((file) => fn(file, dir));
}})

export const generatePageImportCode = async (contentPath: string) => {
	const importFunctions = await getAllFiles(contentPath).map((file, dir) => {
		const url = transformPathToUrl(dir, file);
		return wrapperImportFunctionString(url, adapter.getFullPath(file));
	});
	return wrapperExport('pages', wrapperObject(importFunctions));
};


export const generateRoutesCode = async (contentPath: string) => {
	const importFunctions = await getAllFiles(contentPath).map((file, dir) => {
		const url = transformPathToUrl(dir, file);
		return wrapperUrlPath(url, adapter.getFullPath(file));
	});
	return wrapperExport('routes', wrapperObject(importFunctions));
}

export const getRoutesToPrerender = async (contentPath: string) => {
	return getAllFiles(contentPath).map((file, dir) => transformPathToUrl(dir, file));
}
