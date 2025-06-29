import { addTrailingSlash } from './utils/paths.js';
import { routes, pages } from '$embodi/pages';
import { data as globalData } from '$embodi/data';

const convertUrlToPath = async (url: string) => {
	return routes[url];
};

const getPageFromUrl = async (_url: string | URL) => {
	const url = typeof _url === 'string' ? addTrailingSlash(_url) : _url.pathname;
	const pageImportFu = pages[url];
	if (typeof pageImportFu !== 'function') return;
	const controller = new AbortController();
	const loadData = async (url: string) =>
		(await fetch(`${url}data.json`, { signal: controller.signal })).json();
	window.addEventListener('pagehide', () => {
		controller.abort();
	});
	const [{ default: page }, data] = await Promise.all([pageImportFu(), loadData(url)]);
	const mergedData = {
		...globalData,
		...data
	};

	return {
		...page,
		data: mergedData
	};
};

export const createRouter = () => {
	const loadPage = async (url: string) => {
		const page = getPageFromUrl(url);
		return page;
	};

	return {
		load: loadPage,
		path: convertUrlToPath
	};
};
