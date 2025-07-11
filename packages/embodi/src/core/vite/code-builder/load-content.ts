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
import { normalizePath } from 'vite';
import { addTrailingSlash } from '../utils/paths.js';

export enum FILE_TYPE {
	INDEX,
	PAGE,
	DATA
}

export type PageObject = {
	type: FILE_TYPE;
	url: NormalizeUrlPath;
	page: number[];
	data: number[] | null;
	battery?: number;
};

export const VIRTUAL_PAGE_PREFIX = 'virtual-page:';

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
const snippetPromiseAll = (items?: string[]): string =>
	items?.length ? `Promise.all(${snippetArray(items)})` : '[]';
const snippetDataImports = pipe(resolveLinks, map(snippetImport), snippetPromiseAll);
const snippetContentImports = pipe(resolveLinks, map(snippetImportEmbodi), snippetPromiseAll);
const generateIdMap = (link: string): [string, string] => [
	`i_${crypto.randomUUID().replaceAll('-', '_')}`,
	link
];
const snippetImportMap = pipe(resolveLinks, map(generateIdMap));

const snippetPage = (page: PageObject, ref: UniqueArray<string>) => {
	const snippetMapPages = snippetImportMap(ref, ...page.page);
	const snippetMapData = snippetImportMap(ref, ...(page.data ?? []));
	const dataIds = snippetMapData.map(([id]) => id);
	const pageIds = snippetMapPages.map(([id]) => id);
	const code = `
  import { mergeOneLevelObjects } from 'embodi/utils'
  ${snippetMapData.map(([id, link]) => `import ${id} from "${normalizePath(link)}";`).join(';\n')}
  ${snippetMapPages
		.map(([id, link]) => `import * as ${id} from "${snippetPathEmdodi(link)}";`)
		.join(';\n')}

  const defaultData = [
  ${dataIds.join(',\n')}
  ];
  const pages = [
  ${pageIds.join(',\n')}
  ];
  const page = mergeOneLevelObjects(...pages);
  ${page.data === null ? '' : 'const mergedData = mergeOneLevelObjects(...defaultData, page.data);'}
  ${
		page.data === null
			? 'export default { ...page }'
			: 'export default { ...page, data: mergedData }'
	}
`;
	return code;
};

const snippetPageImportLink = (url: string) =>
	`() => import("${VIRTUAL_PAGE_PREFIX}${addTrailingSlash(url)}")`;

const snippetObjectChunkWrapper = (imports: string[]) => `({${imports.join(',')}})`;
const snippetFile = (name: string, content: string) => `export const ${name} = ${content};`;

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
	const { pages, data, scripts } = groupFilesByType(files);

	return {
		contentDir: dir,
		pages,
		data,
		scripts
	};
};

const isIngnoredFile = (file: LoomFile) => ['.DS_Store'].includes(file.name);
const isDataFile = (file: LoomFile) => file.name.startsWith('+data.');
const isSpecialFile = (file: LoomFile) => file.name.startsWith('+') && !isDataFile(file);
const isScriptFile = (file: LoomFile) => file.extension === 'js' || file.extension === 'ts';

export const groupFilesByType = (files: LoomFile[]) => {
	return files.reduce(
		(acc, file) => {
			if (isIngnoredFile(file)) {
				return acc;
			} else if (isDataFile(file)) {
				return { ...acc, data: [...acc.data, file] };
			} else if (isScriptFile(file)) {
				return { ...acc, scripts: [...acc.scripts, file] };
			} else if (isSpecialFile(file)) {
				return acc;
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

export type UrlMap = [NormalizeUrlPath, number, FILE_TYPE];

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

export const mapDataToPage = (pageMap: UrlMap, dataMap: UrlMap[]): number[] => {
	const [pageUrl, _, fileType] = pageMap;
	const urlParts = splitNormalizedUrlPath(pageUrl);
	fileType !== FILE_TYPE.INDEX && urlParts.pop(); // remove last if not index file

	const rootNode: [NormalizeUrlPath, number[]] = ['' as NormalizeUrlPath, []];
	const [, refs] = ['', ...urlParts].reduce(([url, refs], part) => {
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
		//const pageCodeFunction = snippetPageImport(page, linkRef);
		const pageCodeFunction = snippetPageImportLink(page.url);
		// rename it to chunk
		return snippetObjectChunk(page.url, pageCodeFunction);
	});
	const pagesCodeObject = snippetObjectChunkWrapper(pagesCodeSnippets);
	return snippetFile('pages', pagesCodeObject);
};

export const generatePageCode = async (pages: PageObject[], linkRef: string[], url: string) => {
	const pageData = pages.find((page) => page.url === url);
	if (!pageData) return ``;
	const snippet = snippetPage(pageData, linkRef);
	return snippet;
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
		const mappedData = data?.map((index) => loadedFiles[index]);
		const mappedPage = page.map((page) => loadedFiles[page]);
		const mergedData = mergeOneLevelObjects(...(mappedData ?? []), ...mappedPage);
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
