import { addTrailingSlash } from '../utils/paths.js';

const convertUrlToPath = async (url: string) => {
	const { routes } = await import('$embodi/pages');

	return routes[url];
};

const getPageFromUrl = async (url: string) => {
	const { pages } = await import('$embodi/pages');
	const { data } = await import('$embodi/data');

	const pageImportFu = pages[addTrailingSlash(url)];
	if (!pageImportFu) return;

	const page = await pageImportFu();
	const mergedData = {
		...data,
		...page.data
	};
	return {
		...page,
		data: {
			page: {
				url
			},
			...mergedData
		}
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
