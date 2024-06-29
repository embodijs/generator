import { describe, test, expect } from 'vitest';
import { validateResolveId, isValidLoadId, VIRTUAL_MODULE_PREFIX } from './virtuals.js';
import { faker } from '@faker-js/faker';

describe('validations', () => {
	test.each([
		{ id: 'foo', types: ['foo'] },
		{ id: 'bar', types: ['foo', 'bar'] },
		{ id: 'cotton', types: ['foo', 'bar', 'cotton', 'coding'] },
		{ id: 'cotton-coding', types: ['foo', 'bar', 'cotton', 'cotton-coding', 'coding'] },
		{ id: 'cotton_coding', types: ['foo', 'bar', 'cotton', 'cotton_coding', 'coding'] }
	])('validateResolveId resolve with id %s', ({id, types}) => {
		id = `${VIRTUAL_MODULE_PREFIX}/${id}`;
		expect(validateResolveId(id, ...types)).toBe(`\0${id}`);
	});

	test.each([
		{ id: 'foo', types: ['bar'] },
		{ id: 'bar', types: ['foo', 'cotton'] },
		{ id: 'cotton', types: ['foo', 'bar', 'coding'] },
		{ id: 'cotton-coding', types: ['foo', 'bar', 'cotton', 'coding'] },
		{ id: 'cotton_coding', types: ['foo', 'bar', 'cotton', 'coding'] }
	])('validateResolveId resolve with null %s', ({id, types}) => {
		id = `${VIRTUAL_MODULE_PREFIX}/${id}`;
		expect(validateResolveId(id, ...types)).toBeNull();
	});

	test.each([
		{ id: 'apple', types: ['apple'] },
		{ id: 'banana', types: ['fruit', 'yellow', 'banana'] },
		{ id: 'orange', types: ['fruit', 'orange', 'orange'] },
		{ id: 'grape', types: ['fruit', 'purple', 'grape'] },
		{ id: 'watermelon', types: ['fruit', 'green', 'juicy', 'watermelon'] }
	])('validateResolveId resolve with id %s', ({id, types}) => {
		const fullId = `${VIRTUAL_MODULE_PREFIX}/${id}`;
		const resolvedId = validateResolveId(fullId, ...types)!;
		expect(isValidLoadId(resolvedId, id)).toBe(true);
		const randomId = faker.animal.dog();
		expect(isValidLoadId(resolvedId, randomId)).toBe(false);
	});

});