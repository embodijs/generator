import { addTrailingSlash } from './utils/paths.js';
import { routes, pages } from '$embodi/pages';
import { data as globalData } from '$embodi/data';
import type { PageData } from 'core/definitions/types.js';

const convertUrlToPath = async (url: string) => {
	return routes[url];
};

export class PageDoesNotExistException extends Error {
	constructor(message = 'Page does not exist') {
		super(message);
		this.name = 'PageDoesNotExistException';
	}
}

const getPageImport = (url: string): (() => Promise<{ default: PageData }>) => {
	if (pages.hasOwnProperty(url) && typeof pages[url] === 'function') {
		return pages[url];
	}

	throw new PageDoesNotExistException();
};

const getPageFromUrl = async (_url: string | URL) => {
	const url = typeof _url === 'string' ? addTrailingSlash(_url) : _url.pathname;

	const pageImportFu = getPageImport(url);
	const controller = new AbortController();
	const loadData = async (url: string) =>
		(await fetch(`${url}content.json`, { signal: controller.signal }))?.json();
	window.addEventListener('pagehide', () => {
		controller.abort(); // Abort the fetch request when the page is hidden
	});
	const [{ default: page }, content] = await Promise.all([pageImportFu(), loadData(url)]);
	const mergedData = {
		...globalData,
		...content.data
	};

	return {
		...page,
		data: mergedData,
		html: content.html
	};
};

export const createRouter = () => {
	const loadPage = async (url: string) => {
		const page = getPageFromUrl(url);
		return page;
	};

	return {
		load: loadPage,
		preload: async (url: string) => {
			const page = getPageImport(url);
			await page();
		},
		path: convertUrlToPath
	};
};
