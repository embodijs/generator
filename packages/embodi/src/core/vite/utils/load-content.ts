import type { Directory, LoomFile } from '@loom-io/core';
import { adapter, frontMatterConverter } from './project-adapter.js';
import { type PublicDirs } from '../../app/config.js';
import {
	normalizeUrlPath,
	splitNormalizedUrlPath,
	type NormalizeUrlPath
} from '../../utils/paths.js';

const snippedPathEmdodi = (path: string) => `${path}.embodi`;
const snippedImportEmbodi = (path: string) => `import('${snippedPathEmdodi(path)}')`;
const snippedImport = (path: string) => `import('${path}')`;
const snippedObjectJunk = (name: string, value: string) => `"${name}": ${value}`;
const snippedArray = (items: string[]) => `[${items.join(',')}]`;
const snippedPromiseAll = (items?: string[]) =>
	items?.length ? `await Promise.all(${snippedArray(items)})` : '[]';
const snippedPageImport = (pageImport: string, dataImports: string[]) =>
	`async function () {
  const data = ${snippedPromiseAll(dataImports)}
  const page = await ${pageImport};
  const defaultData = data.map(d => d.default);
  return {
    ...page,
    data: [...defaultData, page.data]
  }
}`;
const snippedObjectJunkWrapper = (imports: string[]) => `({${imports.join(',')}})`;
const snippedExport = (name: string, content: string) => `export const ${name} = ${content}`;

export const transformPagePathToUrl = (dir: Directory, file: LoomFile) => {
	const { extension } = file;
	if (!extension) {
		throw new Error(`File ${file.path} has no extension`);
	}

	if (file.getNameWithoutExtension() === 'index' || file.getNameWithoutExtension() === '+data') {
		return normalizeUrlPath(`/${dir.relativePath(file.dir) ?? ''}`);
	}
	const relativePath = dir.relativePath(file)!;
	return normalizeUrlPath(`/${relativePath.slice(0, -(extension.length + 1))}`);
};

export const getAllFiles = async (publicDirs: PublicDirs) => {
	const { content } = publicDirs;
	const dir = adapter.dir(content);
	const files = (await dir.files(true)).asArray();
	const { pages, data } = splitPagesAndData(files);

	return {
		contentDir: dir,
		pages,
		data
	};
};

export const splitPagesAndData = (files: LoomFile[]) => {
	return files.reduce(
		(acc, file) => {
			if (file.name.startsWith('+data.')) {
				return { ...acc, data: [...acc.data, file] };
			} else {
				return { ...acc, pages: [...acc.pages, file] };
			}
		},
		{ pages: [], data: [] } as { pages: LoomFile[]; data: LoomFile[] }
	);
};

export const getPageImportPath = (file: LoomFile) => snippedPathEmdodi(adapter.getFullPath(file));

export const loadPageData = async (file: LoomFile) => {
	const { data } = await frontMatterConverter.parse(file);
	if (!data || Object.keys(data).length === 0) {
		return undefined;
	}
	return data;
};

type ImportMap = [NormalizeUrlPath, string];

const mapImportToUrl = (files: LoomFile[], contentDir: Directory): ImportMap[] => {
	return files
		.map((file) => {
			const url = transformPagePathToUrl(contentDir, file);
			const absolutePath = adapter.getFullPath(file);
			return [url, snippedImport(absolutePath)] as ImportMap;
		})
		.sort((a, b) => b[0].localeCompare(a[0]));
};

const getDataImportByUrl = (
	url: NormalizeUrlPath,
	dataImports: ImportMap[]
): string | undefined => {
	const [, dataImportCode] = dataImports.find(([importUrl]) => url === importUrl) ?? [[]];
	return dataImportCode;
};

const mapDataToPage = (
	pageUrl: NormalizeUrlPath,
	dataImports: ImportMap[],
	isIndexFile: boolean
): string[] => {
	const rootUrl = '/';
	const dataImportCode = getDataImportByUrl(pageUrl, dataImports);
	const urlParts = splitNormalizedUrlPath(pageUrl);
	isIndexFile || urlParts.pop(); // remove last if not index file

	if (urlParts.length === 0) {
		return dataImportCode ? [dataImportCode] : [];
	}

	const rootNode: [NormalizeUrlPath, string[]] = [rootUrl, dataImportCode ? [dataImportCode] : []];

	const [, imports] = urlParts.reduce(([url, imports], part) => {
		const current: NormalizeUrlPath = `${url}${part}/`;
		const dataImport = getDataImportByUrl(current, dataImports);
		if (dataImport) {
			return [current, [...imports, dataImport]];
		}
		return [current, imports];
	}, rootNode);
	return imports;
};

export const generatePageImportCode = async (publicDirs: PublicDirs) => {
	const { contentDir, pages, data } = await getAllFiles(publicDirs);
	const dataImportMap = mapImportToUrl(data, contentDir);
	const importFunctions = pages.map((pageFile) => {
		const isIndexFile = pageFile.getNameWithoutExtension().toLowerCase() === 'index';
		const url = transformPagePathToUrl(contentDir, pageFile);
		const dataImports = mapDataToPage(url, dataImportMap, isIndexFile);
		const pageCode = snippedPageImport(
			snippedImportEmbodi(adapter.getFullPath(pageFile)),
			dataImports
		);
		return snippedObjectJunk(url, pageCode);
	});
	return snippedExport('pages', snippedObjectJunkWrapper(importFunctions));
};

export const getRoutesToPrerender = async (publicDirs: PublicDirs) => {
	const { contentDir, pages } = await getAllFiles(publicDirs);
	return pages.map((file) => transformPagePathToUrl(contentDir, file));
};
