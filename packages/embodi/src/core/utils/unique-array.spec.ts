import { expect, test, describe } from 'vitest';
import { UniqueArray } from './unique-array';

describe('uniqueArray', () => {
	test('push and pop simple', () => {
		const arr = new UniqueArray();
		arr.push('a');
		arr.push('b');
		expect(arr.pop()).toBe('b');
		expect(arr.pop()).toBe('a');
	});

	test('push and pop unique', () => {
		const arr = new UniqueArray();
		expect(arr.push('a')).toBe(0);
		expect(arr.push('b')).toBe(1);
		expect(arr.push('a')).toBe(0);
		expect(arr.pop()).toBe('b');
		expect(arr.pop()).toBe('a');
	});

	test('push and pop unique with duplicates', () => {
		const arr = new UniqueArray();
		expect(arr.push('a')).toBe(0);
		expect(arr.push('b')).toBe(1);
		expect(arr.push('a')).toBe(0);
		expect(arr.push('b')).toBe(1);
		expect(arr.pop()).toBe('b');
		expect(arr.pop()).toBe('a');
	});

	test('shift and unshift simple', () => {
		const arr = new UniqueArray();
		expect(arr.unshift('a')).toBe(0);
		expect(arr.unshift('b')).toBe(0);
		expect(arr.shift()).toBe('b');
		expect(arr.shift()).toBe('a');
	});

	test('shift and unshift unique', () => {
		const arr = new UniqueArray();
		expect(arr.unshift('a')).toBe(0);
		expect(arr.unshift('b')).toBe(0);
		expect(arr.unshift('a')).toBe(1);
		expect(arr.shift()).toBe('b');
		expect(arr.shift()).toBe('a');
	});
});
