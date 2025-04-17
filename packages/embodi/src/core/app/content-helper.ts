import type { PageImportFunction, LoadAction, AnyObject } from '../definitions/types.js';

export const loadPages = async <T extends string>(
	pages: Record<T, PageImportFunction>,
	urls: T[]
) => {
	return Promise.all(
		urls.map(async (url) => {
			const page = pages[url];
			return {
				...(await page()).default,
				url
			};
		})
	);
};

export const runLoadAction = async ({ load, data }: { load?: LoadAction; data: AnyObject }) =>
	load ? load({ data }) : data;
