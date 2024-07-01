const convertUrlToPath = (source: string, url: string) => {
	source  = source === "/" ? "" : source;
	return ["", "/"].includes(url)
		? `${source}/index.md`
		: `${source}${url}.md`;
};

const getPageFromUrl = async (url: string) => {
	const {pages, source} = await import('$embodi/pages');
	const { data } = await import('$embodi/data');
	const path = convertUrlToPath(source, url);

	const pageImportFu = pages[path];
	if(!pageImportFu) return;

	const page = await pageImportFu();
	return { ...page, data: {
		...data,
		...page.data
	}};

}

export const createRouter = () => {

	const loadPage = async (url: string) => {
		const page = getPageFromUrl(url);
		return page;
	};

	return {
		load: loadPage,
		path: convertUrlToPath
	}

}