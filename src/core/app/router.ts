import type { SvelteComponent } from "svelte";


export const createRouter = () => {
	// @ts-ignore
	const pagesPromise = import.meta.glob("/**/*.md")

	const convertUrlToPath = (url: string) => {
		return ["", "/"].includes(url)
			? "/index.md"
			: `${url}.md`;
	};

	const loadPage = async (url: string) => {
		const pages = pagesPromise;
		const path = convertUrlToPath(url);
		if (pages[path]) {
			return pages[path]() as Promise<{
					data: Record<string, unknown>,
					content: string,
					Component?: SvelteComponent['default']
				}>
		}
	};


	return {
		load: loadPage,
		path: convertUrlToPath
	}

}