import type { PageLoad } from './$types';

export const prerender = true;
export const ssr = true;
export const csr = false;
export const load: PageLoad = async ({ fetch, url }) => {
	const main = new URL(url);
	main.pathname = 'main';
	const response = await fetch(main);

	// const {type, ...pageData}: PageData = (await response.json());

	return {
		page: await response.text()
	};
};
