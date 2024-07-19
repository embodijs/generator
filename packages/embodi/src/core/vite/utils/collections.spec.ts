import { expect, test, describe } from 'vitest';
import { setDirection, getValue, compareString, compareDate, CollectionMeta,  } from './collections';
import { faker } from '@faker-js/faker';
import exp from 'constants';


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


	});
});