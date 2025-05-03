import { addTrailingSlash } from './utils/paths.js';
import { routes, pages } from '$embodi/pages';
import { data } from '$embodi/data';

const convertUrlToPath = (url: string) => {
	return routes[url];
};

const getPageFromUrl = async (_url: string | URL) => {
	const url = typeof _url === 'string' ? _url : _url.pathname;
	const pageImportFu = pages[addTrailingSlash(url)];
	if (!pageImportFu) return;

	const { default: page } = await pageImportFu();
	const mergedData = {
		...data,
		...page.data
	};
	if (!page.Layout && !page.Component) return;
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
