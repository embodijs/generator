import { beforeBuild } from '../index';
import type { RefElementData } from '../type';
import type { RenderHelper } from '@embodi/types';

const baseData: RefElementData = {
	type: 'Ref',
	name: 'header',
	path: './header.json'
};

const jsonData = {
	name: 'header',
	content: {
		type: 'Group',
		content: []
	}
};

describe('Test beforeBuild function', () => {
	test('load File and return data of sub', async () => {
		const helpers = <RenderHelper>(<unknown>{
			load: async () => {
				return jsonData;
			},
			createEngine: () => {
				return helpers;
			},
			compute: async (data: unknown) => {
				return data;
			}
		});
		const data = await beforeBuild(baseData, helpers);
		expect(data).toEqual(jsonData.content);
	});
});
