import type { PageImportFunction } from '../definitions/types.js';

export const loadPages = async <T extends string>(
	pages: Record<T, PageImportFunction>,
	urls: T[]
) => {
	return Promise.all(
		urls.map((url) => {
			const page = pages[url];
			return page();
		})
	);
};
