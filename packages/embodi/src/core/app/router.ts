import { addTrailingSlash } from './utils/paths.js';
import { routes, pages } from '$embodi/pages';
import { data } from '$embodi/data';

const convertUrlToPath = async (url: string) => {
	return routes[url];
};

const getPageFromUrl = async (url: string) => {
  console.log({ url, pages })
	const pageImportFu = pages[addTrailingSlash(url)];
	if (!pageImportFu) return;

	const {default: page} = await pageImportFu();
	console.log({page})
	const mergedData = {
		...data,
		...page.data
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
