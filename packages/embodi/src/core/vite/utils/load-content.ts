import type { Directory, LoomFile } from "@loom-io/core";
import { adapter } from "./project-adapter.js"


export const transformPathToUrl = (dir: Directory, file: LoomFile) => {

	const { extension } = file;
	if(!extension) {
		throw new Error(`File ${file.path} has no extension`);
	}
	if(file.getNameWithoutExtension() === 'index') {
		return dir.relativePath(file.dir) ?? '';
	}
	const relativePath = dir.relativePath(file)!;
	return relativePath.slice(0, -(extension.length+1));
}

const wrapperImportFunctionString = (name: string, path: string) => `"/${name}": () => import('${path}.embodi')`;
const wrapperObject = (imports: string[]) => `({${imports.join(',')}})`;
const wrapperExport = (imports: string) => `export const pages = ${imports}`;

export const generatePageImportCode = async (contentPath: string) => {
	const dir = adapter.dir(contentPath);
	const files = await dir.files(true);
	const importFunctions = files.asArray().map((file) => {
		const url = transformPathToUrl(dir, file);
		return wrapperImportFunctionString(url, adapter.getFullPath(file));
	});
	return wrapperExport(wrapperObject(importFunctions));
};


// export const prepareContentImports = async (contentPath: string) => {
// 	const dir = adapter.dir(contentPath);
// 	const root = adapter.dir('/');
// 	const files = await dir.files(true);
// 	return files.asArray().reduce((acc, file) => {
// 		const { extension } = file;
// 		if(!extension) {
// 			return acc;
// 		}
// 		const path =
// 		return {
// 			...acc,
// 			[extension]: {
// 				...(acc[extension] || {}),
// 				test: () => import(adapter.getFullPath(file))
// 			}
// 		};
// 	}, {} as Record<string, >);
// };
