import { FILE_TYPE, mapDataToPage, type UrlMap } from './load-content';
import { describe, test, expect } from 'vitest';

describe('mapDataToPage', () => {
	const dataMap: UrlMap[] = [
		['/', 11, FILE_TYPE.DATA],
		['/test/', 12, FILE_TYPE.DATA],
		['/sub/test/', 13, FILE_TYPE.DATA],
		['/test/test2/', 14, FILE_TYPE.DATA]
	];

	test('should map two data files to index page', () => {
		const pageMap: UrlMap = ['/test/', 1, FILE_TYPE.INDEX];

		const refs = mapDataToPage(pageMap, dataMap);
		expect(refs).toEqual([11, 12]);
	});

	test('should map data to page', () => {
		const pageMap: UrlMap = ['/test/', 1, FILE_TYPE.PAGE];

		const refs = mapDataToPage(pageMap, dataMap);
		expect(refs).toEqual([11]);
	});

	test('three level for index and page', () => {
		const pageMap: UrlMap = ['/test/test2/', 1, FILE_TYPE.PAGE];

		const pageRefs = mapDataToPage(pageMap, dataMap);
		expect(pageRefs).toEqual([11, 12]);

		const indexMap: UrlMap = ['/test/test2/', 1, FILE_TYPE.INDEX];
		const indexRefs = mapDataToPage(indexMap, dataMap);
		expect(indexRefs).toEqual([11, 12, 14]);
	});
});
