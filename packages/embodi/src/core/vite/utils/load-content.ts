import type { Directory, LoomFile } from '@loom-io/core';
import { adapter, frontMatterConverter } from './project-adapter.js';
import { type PublicDirs } from '../../app/config.js';
import { pipe } from 'pipe-and-combine';
import {
	normalizeUrlPath,
	splitNormalizedUrlPath,
	type NormalizeUrlPath
} from '../../utils/paths.js';
import { UniqueArray } from '../../utils/unique-array.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

enum FILE_TYPE {
	INDEX,
	PAGE,
	DATA
}

type PageObject = {
	type: FILE_TYPE;
	url: NormalizeUrlPath;
	page: number;
	data: number[];
};

const map =
	<T, U>(fn: (arg: T) => U) =>
	(arr: T[]) =>
		arr.map(fn);

const resolveLinks = (refs: UniqueArray<string>, ...indezes: number[]) => {
	return indezes.map((index) => refs.at(index)!);
};
const snippedPathEmdodi = (path: string) => `${path}.embodi`;
const snippedImportEmbodi = (path: string) => `import('${snippedPathEmdodi(path)}')`;
const snippedImport = (path: string) => `import('${path}')`;
const snippedObjectJunk = (name: string, value: string) => `"${name}": ${value}`;
const snippedArray = (items: string[]) => `[${items.join(',')}]`;
const snippedPromiseAll = (items?: string[]) =>
	items?.length ? `await Promise.all(${snippedArray(items)})` : '[]';
const snippedDataImports = pipe(resolveLinks, map(snippedImport), snippedPromiseAll);
const snippedPageImport = (page: PageObject, ref: UniqueArray<string>) =>
	`async function () {
  const data = ${snippedDataImports(ref, ...page.data)}
  const page = await ${snippedImportEmbodi(resolveLinks(ref, page.page)[0])};
  const defaultData = data.map(d => d.default);
  const mergedData = mergeOneLevelObjects(...defaultData, page.data);
  return {
    ...page,
    data: mergedData
  }
}`;
const pathToMergeOneLevelObjects = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'../../utils/data.js'
);
const snippedObjectJunkWrapper = (imports: string[]) => `({${imports.join(',')}})`;
const snippedFile = (name: string, content: string) =>
	`import { mergeOneLevelObjects } from '${pathToMergeOneLevelObjects}';
export const ${name} = ${content};`;

export const transformPathToUrl = (
	dir: Directory,
	file: LoomFile
): [NormalizeUrlPath, FILE_TYPE] => {
	const { extension } = file;
	if (!extension) {
		throw new Error(`File ${file.path} has no extension`);
	}
	if (file.getNameWithoutExtension() === 'index') {
		return [normalizeUrlPath(`/${dir.relativePath(file.dir) ?? ''}`), FILE_TYPE.INDEX];
	} else if (file.getNameWithoutExtension() === '+data') {
		return [normalizeUrlPath(`/${dir.relativePath(file.dir) ?? ''}`), FILE_TYPE.DATA];
	} else {
		const relativePath = dir.relativePath(file)?.slice(0, -(extension.length + 1));
		return [normalizeUrlPath(`/${relativePath}`), FILE_TYPE.PAGE];
	}
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

type UrlMap = [NormalizeUrlPath, number, FILE_TYPE];

const mapUrlToArray = (
	files: LoomFile[],
	contentDir: Directory,
	ref = new UniqueArray<string>()
): [UrlMap[], UniqueArray<string>] => {
	const urls = files
		.map((file) => {
			const [url, fileType] = transformPathToUrl(contentDir, file);
			const absolutePath = adapter.getFullPath(file);
			const index = ref.push(absolutePath);
			return [url, index, fileType] as UrlMap;
		})
		.sort((a, b) => b[0].localeCompare(a[0]));

	return [urls, ref];
};

const getRefByUrl = (url: NormalizeUrlPath, dataImports: UrlMap[]): number | undefined => {
	const [, dataImportCode] = dataImports.find(([importUrl]) => url === importUrl) ?? [[]];
	return dataImportCode;
};

const mapDataToPage = (pageMap: UrlMap, dataMap: UrlMap[]): number[] => {
	const rootUrl = '/';
	const [pageUrl, pageRef, fileType] = pageMap;
	const dataRef = getRefByUrl(pageUrl, dataMap);
	const urlParts = splitNormalizedUrlPath(pageUrl);
	fileType === FILE_TYPE.INDEX || urlParts.pop(); // remove last if not index file

	if (urlParts.length === 0) {
		return dataRef ? [dataRef] : [];
	}

	const rootNode: [NormalizeUrlPath, number[]] = [rootUrl, dataRef ? [dataRef] : []];
	const [, refs] = urlParts.reduce(([url, refs], part) => {
		const current: NormalizeUrlPath = `${url}${part}/`;
		const dataRef = getRefByUrl(current, dataMap);
		if (dataRef == null) {
			return [current, refs];
		}
		return [current, [...refs, dataRef]];
	}, rootNode);
	return refs;
};

const createPageObjects = (pageMaps: UrlMap[], dataMaps: UrlMap[]): PageObject[] => {
	return pageMaps.map((pageMap) => {
		const [url, index, type] = pageMap;
		const dataRefs = mapDataToPage(pageMap, dataMaps);
		return {
			type,
			url,
			page: index,
			data: dataRefs
		};
	});
};

export const generateContentMap = async (
	publicDirs: PublicDirs
): Promise<[PageObject[], string[]]> => {
	const { contentDir, pages, data } = await getAllFiles(publicDirs);
	const [dataUrls, dataLinkRef] = mapUrlToArray(data, contentDir);
	const [pageUrls, linkRef] = mapUrlToArray(pages, contentDir, dataLinkRef);
	const pageObjects = createPageObjects(pageUrls, dataUrls);
	return [pageObjects, linkRef];
};

export const generatePageImportCode = async (pages: PageObject[], linkRef: string[]) => {
	const pagesCodeSnippeds = pages.map((page) => {
		const pageCodeFunction = snippedPageImport(page, linkRef);
		return snippedObjectJunk(page.url, pageCodeFunction);
	});
	const pagesCodeObject = snippedObjectJunkWrapper(pagesCodeSnippeds);
	return snippedExport('pages', pagesCodeObject);
};

export const getRoutesToPrerender = async (publicDirs: PublicDirs) => {
	const { contentDir, pages } = await getAllFiles(publicDirs);
	return pages.map((file) => transformPathToUrl(contentDir, file));
};
