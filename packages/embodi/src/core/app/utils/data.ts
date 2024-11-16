import type { AnyObject } from '../../definitions/types.js';

export const mergeOneLevelObjects = (...obj: AnyObject[]) => {
	return obj.reduce((acc, current) => {
		return { ...acc, ...current };
	}, {});
};
