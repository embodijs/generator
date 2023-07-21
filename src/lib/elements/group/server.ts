import type { ElementData, RenderHelper, beforeBuildFunc } from '@embodi/types';

import type { GroupElementData } from './types';
export const beforeBuild: beforeBuildFunc<GroupElementData> = async (
	data: GroupElementData,
	helper: RenderHelper
): Promise<ElementData> => {
	return {
		...data,
		content: await helper.compute(data.content)
	};
};
