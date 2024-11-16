import { expect, test, describe } from 'vitest';
import { setDirection, getValue, compareString, compareDate, CollectionMeta, prepareFilter, prepareSort, prepareLimit, convertCollectionParamsToPreparedFunctions, CollectionParams } from './collections';
import { faker } from '@faker-js/faker';


const fakeMeta = ({
	tag = faker.lorem.word(),
	createdAt = faker.date.recent(),
	updatedAt = faker.date.recent(),
	page = faker.system.directoryPath(),
	importPath = faker.system.filePath()
}: Partial<CollectionMeta>) => ({
	tag,
	createdAt,
	updatedAt,
	page,
	importPath
});

describe('collections', () => {
	describe('atoms', () => {
		test.each(['asc', 'desc'] as const)('setDirection %s', (direction) => {
			const collection = fakeMeta({});
			expect(setDirection([collection, collection], direction)).toEqual([collection, collection]);
			expect(setDirection([collection, collection], direction)).toEqual([collection, collection].reverse());
		});

		test.each(['tag', 'createdAt', 'updatedAt', 'page'] as const)('getValue', (attr) => {
			const collection = fakeMeta({});
			expect(getValue([collection, collection], attr)).toEqual([collection[attr], collection[attr]]);
		});

		test.each(['asc', 'desc'] as const)('compareString', (direction) => {
			const a = fakeMeta({ tag: 'a' });
			const b = fakeMeta({ tag: 'b' });
			expect(compareString('tag', direction)(a, b)).toBe(direction === 'asc' ? -1 : 1);
		});

		test('compareDate', () => {
			const a = fakeMeta({ createdAt: new Date('2021-01-01') });
			const b = fakeMeta({ createdAt: new Date('2021-01-02') });

			expect(compareDate('createdAt', 'asc')(a, b)).toBeLessThan(-1);
			expect(compareDate('createdAt', 'desc')(a, b)).toBeGreaterThan(1);
		});

		describe('prepares', () => {
			test('prepareFilter', () => {
				const a = fakeMeta({ tag: 'travel' });
				const b = fakeMeta({ tag: 'stay home' });
				const c = fakeMeta({ tag: 'travel' });

				const filter = prepareFilter(['stay home']);
				expect(filter([a, b, c])).toEqual([b]);
			});

			test('prepareSort', () => {
				const a = fakeMeta({ tag: 'a', createdAt: new Date('2021-01-01') });
				const b = fakeMeta({ tag: 'b', createdAt: new Date('2021-01-02') });
				const c = fakeMeta({ tag: 'c', createdAt: new Date('2021-01-03') });

				const sort = prepareSort('createdAt', 'asc');
				expect(sort([c, a, b])).toEqual([a, b, c]);
				const sortDesc = prepareSort('tag', 'desc');
				expect(sortDesc([c, a, b])).toEqual([c, b, a]);
			});

			test('prepareLimit', () => {
				const a = fakeMeta({ tag: 'a' });
				const b = fakeMeta({ tag: 'b' });
				const c = fakeMeta({ tag: 'c' });

				const limit = prepareLimit(2);
				expect(limit([a, b, c])).toEqual([a, b]);
				const skip = prepareLimit(2, 1);
				expect(skip([a, b, c])).toEqual([b, c]);
				const noLimit = prepareLimit();
				expect(noLimit([a, b, c])).toEqual([a, b, c]);
				const notEnough = prepareLimit(4);
				expect(notEnough([a, b, c])).toEqual([a, b, c]);
				const skipNotEnough = prepareLimit(4, 3);
				expect(skipNotEnough([a, b, c])).toEqual([]);
			});
		});


	});

	describe('convertCollectionParamsToPreparedFunctions', () => {
		test('only', () => {
			const params = {
				only: ['a'],
			};

			const prepared = convertCollectionParamsToPreparedFunctions(params);
			expect(prepared).toHaveLength(1);
			expect(prepared[0]).toBeInstanceOf(Function);

		});

		test('skip', () => {
			const params = {
				skip: 2,
			};

			const prepared = convertCollectionParamsToPreparedFunctions(params);
			expect(prepared).toHaveLength(1);
			expect(prepared[0]).toBeInstanceOf(Function);
		});

		test('limit', () => {
			const params = {
				limit: 2,
			};

			const prepared = convertCollectionParamsToPreparedFunctions(params);
			expect(prepared).toHaveLength(1);
			expect(prepared[0]).toBeInstanceOf(Function);
		});

		test('all', () => {
			const params: CollectionParams = {
				only: ['a'],
				skip: 2,
				limit: 2,
				sortBy: 'tag',
				sortDirection: 'asc'
			};

			const prepared = convertCollectionParamsToPreparedFunctions(params);
			expect(prepared).toHaveLength(3);
		});
	});
});
