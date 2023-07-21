import type { ComponentFile, beforeBuildFunc } from '@embodi/types';
import type { RefElementData } from './type';

export const beforeBuild: beforeBuildFunc<RefElementData> = async ({ path }, helper) => {
	if (path == null) {
		throw new Error('Ref could not be run beforeBuild: missing path element in data');
	}
	const component = await helper.load<ComponentFile>(path);
	return helper.createEngine(path).compute(component.content);
};
