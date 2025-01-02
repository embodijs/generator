import type { Directory, LoomFile } from '@loom-io/core';
import { adapter, frontMatterConverter, converter } from '../utils/project-adapter.js';
import { type PublicDirs } from '../utils/config.js';
import { pipe } from 'pipe-and-combine';
import { normalizeUrlPath, splitNormalizedUrlPath, type NormalizeUrlPath } from '../utils/paths.js';
import { UniqueArray } from '../utils/unique-array.js';
import { FilesystemAdapter } from '@loom-io/node-filesystem-adapter';
import { mergeOneLevelObjects } from '../utils/data.js';
import type { AnyObject } from '../../definitions/types.js';
import { normalize } from 'node:path';

enum FILE_TYPE {
	INDEX,
	PAGE,
	DATA
}

export type PageObject = {
	type: FILE_TYPE;
	url: NormalizeUrlPath;
	page: number;
	data: number[];
	battery?: number;
};

const map =
	<T, U>(fn: (arg: T) => U) =>
	(arr: T[]) =>
		arr.map(fn);

const normalizeImportPath = (path: string) => normalize(path).replaceAll('\\', '\\\\');

const resolveLinks = (refs: UniqueArray<string>, ...indezes: number[]) => {
	return indezes.map((index) => refs.at(index)!);
};
const snippetPathEmdodi = (path: string) => normalizeImportPath(`${path}.embodi`);
const snippetImportEmbodi = (path: string) => `import('${snippetPathEmdodi(path)}')`;
const snippetImport = (path: string) => `import('${normalizeImportPath(path)}')`;
const snippetObjectChunk = (name: string, value: string) => `"${name}": ${value}`;
const snippetArray = (items: string[]) => `[${items.join(',')}]`;
const snippetExport = (name: string, value: string) => `export const ${name} = ${value}`;
const snippetPromiseAll = (items?: string[]) =>
	items?.length ? `Promise.all(${snippetArray(items)})` : '[]';
const snippetDataImports = pipe(resolveLinks, map(snippetImport), snippetPromiseAll);
const snippetContentImports = pipe(resolveLinks, map(snippetImportEmbodi), snippetPromiseAll);
const snippetPageImport = (page: PageObject, ref: UniqueArray<string>) =>
	`async function () {
  const data = await ${snippetDataImports(ref, ...page.data)}
  const pages = await ${snippetContentImports(ref, ...page.page)};

  const defaultData = data.map(d => d.default);
  const page = mergeOneLevelObjects(...pages);
  const mergedData = mergeOneLevelObjects(...defaultData, page.data);
  return {
    ...page,
    data: mergedData
  }
}`;
const snippetObjectChunkWrapper = (imports: string[]) => `({${imports.join(',')}})`;
const snippetFile = (name: string, content: string) =>
	`import { mergeOneLevelObjects } from 'embodi/utils';
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
		return [normalizeUrlPath(`${dir.relativePath(file.dir) ?? ''}`), FILE_TYPE.INDEX];
	} else if (file.getNameWithoutExtension() === '+data') {
		return [normalizeUrlPath(`${dir.relativePath(file.dir) ?? ''}`), FILE_TYPE.DATA];
	} else {
		const relativePath = dir.relativePath(file)?.slice(0, -(extension.length + 1));
		return [normalizeUrlPath(`${relativePath}`), FILE_TYPE.PAGE];
	}
};

export const getAllFiles = async (publicDirs: PublicDirs) => {
	const { content } = publicDirs;
	const dir = adapter.dir(content);
	const files = (await dir.files(true)).asArray();
	const { pages, data, scripts } = splitPagesAndData(files);

	return {
		contentDir: dir,
		pages,
		data,
		scripts
	};
};

const isIngnoredFile = (file: LoomFile) => ['.DS_Store'].includes(file.name);
const isDataFile = (file: LoomFile) => file.name.startsWith('+data.');
const isScriptFile = (file: LoomFile) => file.extension === 'js' || file.extension === 'ts';

export const splitPagesAndData = (files: LoomFile[]) => {
	return files.reduce(
		(acc, file) => {
			if (isIngnoredFile(file)) {
				return acc;
			} else if (isDataFile(file)) {
				return { ...acc, data: [...acc.data, file] };
			} else if (isScriptFile(file)) {
				return { ...acc, scripts: [...acc.scripts, file] };
			} else {
				return { ...acc, pages: [...acc.pages, file] };
			}
		},
		{ pages: [], data: [], scripts: [] } as {
			pages: LoomFile[];
			data: LoomFile[];
			scripts: LoomFile[];
		}
	);
};

export const getPageImportPath = (file: LoomFile) => snippetPathEmdodi(adapter.getFullPath(file));

// TODO: Replace this structure with a converter supports frontmatter, json and yaml
const readFileData = async (file: LoomFile): Promise<Record<string, unknown>> => {
	const { extension } = file;
	if (!extension) {
		throw new Error(`File ${file.path} has no extension`);
		// TODO: Allow more types, maybe integrate this with converter functions (vite plugins)
	} else if (['yaml', 'yml', 'json'].includes(extension)) {
		return converter.parse(file) as Promise<Record<string, unknown>>;
	} else {
		const { data } = (await frontMatterConverter.parse(file)) as { data: Record<string, unknown> };
		return data ?? {};
	}
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

export const getRefByUrl = (url: NormalizeUrlPath, dataImports: UrlMap[]): number | undefined => {
	const [[, importRef] = [], duplicate] =
		dataImports.filter(([scriptUrl]) => scriptUrl === url) ?? [];
	if (duplicate) {
		console.warn(
			`Embodi founds two script files for the same url (${url}), one will be ignored. To be sure witch one is used one should be removed.`
		);
	}
	return importRef;
};

const mapDataToPage = (pageMap: UrlMap, dataMap: UrlMap[]): number[] => {
	const rootUrl = '/';
	const [pageUrl, pageRef, fileType] = pageMap;
	const dataRef = getRefByUrl(pageUrl, dataMap);
	const urlParts = splitNormalizedUrlPath(pageUrl);
	fileType !== FILE_TYPE.INDEX && urlParts.pop(); // remove last if not index file
	if (urlParts.length === 0) {
		return dataRef != null ? [dataRef] : [];
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

const createPageObjects = (
	pageMaps: UrlMap[],
	dataMaps: UrlMap[],
	scriptMaps: UrlMap[]
): PageObject[] => {
	return pageMaps.map((pageMap) => {
		const [url, index, type] = pageMap;
		const dataRefs = mapDataToPage(pageMap, dataMaps);
		const scriptRef = getRefByUrl(url, scriptMaps);
		return {
			type,
			url,
			page: [index, ...(scriptRef ? [scriptRef] : [])],
			data: dataRefs,
			battery: scriptRef
		};
	});
};

export const generateContentMap = async (
	publicDirs: PublicDirs
): Promise<[PageObject[], string[]]> => {
	const { contentDir, pages, data, scripts } = await getAllFiles(publicDirs);
	const [dataUrls, dataLinkRef] = mapUrlToArray(data, contentDir);
	const [scriptUrls, scriptAndDatatLinkRef] = mapUrlToArray(scripts, contentDir, dataLinkRef);
	const [pageUrls, linkRef] = mapUrlToArray(pages, contentDir, scriptAndDatatLinkRef);
	const pageObjects = createPageObjects(pageUrls, dataUrls, scriptUrls);
	return [pageObjects, linkRef];
};

export const generatePageImportCode = async (pages: PageObject[], linkRef: string[]) => {
  // TODO: snippet
	const pagesCodeSnippets = pages.map((page) => {
		const pageCodeFunction = snippetPageImport(page, linkRef);
		// rename it to chunk
		return snippetObjectChunk(page.url, pageCodeFunction);
	});
	const pagesCodeObject = snippetObjectChunkWrapper(pagesCodeSnippets);
	return snippetFile('pages', pagesCodeObject);
};

export type PageData<T extends AnyObject = AnyObject> = {
	type: FILE_TYPE;
	url: NormalizeUrlPath;
	data: T;
};

export const loadData = async (pages: PageObject[], linkRef: string[]): Promise<PageData[]> => {
	const rootAdapter = new FilesystemAdapter('/');
	const loadedFiles = await Promise.all(
		linkRef.map((ref) => {
			const files = rootAdapter.file(ref);
			return readFileData(files);
		})
	);
	const loadedPageData = pages.map(({ page, data, type, url }) => {
		const mappedData = data.map((index) => loadedFiles[index]);
		const mappedPage = loadedFiles[page];
		const mergedData = mergeOneLevelObjects(...mappedData, mappedPage);
		return {
			type,
			url,
			data: mergedData
		};
	});

	return loadedPageData;
};

export const generateRoutesCode = async (publicDirs: PublicDirs) => {
	const { pages, contentDir } = await getAllFiles(publicDirs);
	const importFunctions = pages.map((file) => {
		const [url] = transformPathToUrl(contentDir, file);
		const pathEmdodi = getPageImportPath(file);
		return snippetObjectChunk(url, `'${pathEmdodi}'`);
	});
	return snippetExport('routes', snippetObjectChunkWrapper(importFunctions));
};

export const getRoutesToPrerender = async (publicDirs: PublicDirs) => {
	const { contentDir, pages } = await getAllFiles(publicDirs);
	return pages.map((file) => transformPathToUrl(contentDir, file)[0]);
};
