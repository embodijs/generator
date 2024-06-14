const convertUrlToPath = (source: string, url: string) => {
	return ["", "/"].includes(url)
		? `${source}/index.md`
		: `${source}${url}.md`;
};

const getPageFromUrl = async (url: string) => {
	const {pages, source} = await import('$embodi/pages');
	const path = convertUrlToPath(source, url);

	const page = pages[path];
	if(page) {
		return page();
	}
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