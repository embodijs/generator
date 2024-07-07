import { type Directory, isDirectory, type LoomFile } from "@loom-io/core";
import { adapter } from "./project-adapter.js"
import type { PublicDirs } from "../../app/config.js";


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

const getPublicDirsInsideContentDir = (publicDirs: PublicDirs): Directory[] => {
	const { content, ...otherPublicDirs } = publicDirs;
	const contentDir = adapter.dir(content);

	return Object
		.values(otherPublicDirs)
		.map((dir) => dir != null && adapter.dir(dir))
		.filter((dir): dir is Directory => isDirectory(dir) && !contentDir.relativePath(dir))

}

export const getAllPages = (publicDirs: PublicDirs) => ({ map: async (fn: (file: LoomFile, dir: Directory) => any) => {
	const { content } = publicDirs;
	const dir = adapter.dir(content);
	const files = await dir.files(true);

	const publicDirsInsideContentDir = getPublicDirsInsideContentDir(publicDirs);

	return files.asArray().map((file) => fn(file, dir)).filter((file) => !publicDirsInsideContentDir.some((dir) => dir.relativePath(file)));
}})

export const generatePageImportCode = async (publicDirs: PublicDirs) => {
	const importFunctions = await getAllPages(publicDirs).map((file, dir) => {
		const url = transformPathToUrl(dir, file);
		return wrapperImportFunctionString(url, adapter.getFullPath(file));
	});
	return wrapperExport('pages', wrapperObject(importFunctions));
};


export const generateRoutesCode = async (publicDirs: PublicDirs) => {
	const importFunctions = await getAllPages(publicDirs).map((file, dir) => {
		const url = transformPathToUrl(dir, file);
		return wrapperUrlPath(url, adapter.getFullPath(file));
	});
	return wrapperExport('routes', wrapperObject(importFunctions));
}

export const getRoutesToPrerender = async (publicDirs: PublicDirs) => {
	return getAllPages(publicDirs).map((file, dir) => transformPathToUrl(dir, file));
}
