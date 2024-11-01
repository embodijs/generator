import { expect, describe, test } from 'vitest';
import { mergeOneLevelObjects } from './data';

describe('utils/data', () => {
	describe('mergeOneLevelObjects', () => {
		test('should merge objects', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { c: 3, d: 4 };
			const obj3 = { e: 5, f: 6 };

			const result = mergeOneLevelObjects(obj1, obj2, obj3);

			expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 });
		});

		test('overwrite', () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { a: 3, d: 4 };
			const obj3 = { e: 5, f: 6 };

			const result = mergeOneLevelObjects(obj1, obj2, obj3);

			expect(result).toEqual({ a: 3, b: 2, d: 4, e: 5, f: 6 });
		});

		test('mulitlevel ist only merging the first level', () => {
			const obj1 = { a: 1, b: { c: 2 } };
			const obj2 = { d: 3, b: { e: 4 } };
			const obj3 = { f: 5, g: 6 };

			const result = mergeOneLevelObjects(obj1, obj2, obj3);

			expect(result).toEqual({ a: 1, b: { e: 4 }, d: 3, f: 5, g: 6 });
		});
	});
});
