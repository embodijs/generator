import { describe, test, expect } from 'vitest';
import { prepareGetPath, prepareLoadIdValidator, prepareResolveIdValidator } from './virtuals.js';
import { faker } from '@faker-js/faker';

const MODULE_NAME = 'LOREM/';
const isValidLoadId = prepareLoadIdValidator(MODULE_NAME);
const validateResolveId = prepareResolveIdValidator(MODULE_NAME);
const getPath = prepareGetPath(MODULE_NAME);

describe('validations', () => {
	test.each([
		{ id: 'foo', types: ['foo'] },
		{ id: 'bar', types: ['foo', 'bar'] },
		{ id: 'cotton', types: ['foo', 'bar', 'cotton', 'coding'] },
		{ id: 'cotton-coding', types: ['foo', 'bar', 'cotton', 'cotton-coding', 'coding'] },
		{ id: 'cotton_coding', types: ['foo', 'bar', 'cotton', 'cotton_coding', 'coding'] }
	])('validateResolveId resolve with id %s', ({id, types}) => {
		id = `${MODULE_NAME}${id}`;
		expect(validateResolveId(id, ...types)).toBe(`\0${id}`);
	});

	test.each([
		{ id: 'foo', types: ['bar'] },
		{ id: 'bar', types: ['foo', 'cotton'] },
		{ id: 'cotton', types: ['foo', 'bar', 'coding'] },
		{ id: 'cotton-coding', types: ['foo', 'bar', 'cotton', 'coding'] },
		{ id: 'cotton_coding', types: ['foo', 'bar', 'cotton', 'coding'] }
	])('validateResolveId resolve with null %s', ({id, types}) => {
		id = `${MODULE_NAME}${id}`;
		expect(validateResolveId(id, ...types)).toBeNull();
	});

	test.each([
		{ id: 'apple', types: ['apple'] },
		{ id: 'banana', types: ['fruit', 'yellow', 'banana'] },
		{ id: 'orange', types: ['fruit', 'orange', 'orange'] },
		{ id: 'grape', types: ['fruit', 'purple', 'grape'] },
		{ id: 'watermelon', types: ['fruit', 'green', 'juicy', 'watermelon'] }
	])('validateResolveId resolve with id %s', ({id, types}) => {
		const fullId = `${MODULE_NAME}${id}`;
		const resolvedId = validateResolveId(fullId, ...types)!;
		expect(isValidLoadId(resolvedId, id)).toBe(true);
		const randomId = faker.animal.dog();
		expect(isValidLoadId(resolvedId, randomId)).toBe(false);
	});

	test('resolve without module', () => {
	  const fullId = `${MODULE_NAME}${faker.animal.dog()}`;
		const resolvedId = validateResolveId(fullId)!;
    expect(resolvedId).not.toBeNull();
		expect(isValidLoadId(resolvedId)).toBe(true);
	})

	test('getPath', () => {
	  const path = faker.system.directoryPath();
		const fullId = `${MODULE_NAME}${path}`;
		const resolvedId = validateResolveId(fullId)!;
		expect(resolvedId).not.toBeNull();
		expect(isValidLoadId(resolvedId)).toBe(true);
		expect(getPath(resolvedId)).toBe(path);
	})



});
