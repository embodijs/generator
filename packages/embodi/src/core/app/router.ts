const convertUrlToPath = async (url: string) => {
	const { routes } = await import('$embodi/pages');

	return routes[url];
};

const getPageFromUrl = async (url: string) => {
	const { pages } = await import('$embodi/pages');
	const { data } = await import('$embodi/data');

	const pageImportFu = pages[url];
	if (!pageImportFu) return;

	const page = await pageImportFu();
	return {
		...page,
		data: {
			page: {
				url
			},
			...data,
			...page.data
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
