export function isRelativePath(path: string) {
	return path.startsWith('./') || path.startsWith('../');
}

export function addTrailingSlash(path: string): `${string}/` {
	if (path.endsWith('/')) {
		return path as `${string}/`;
	}
	return `${path}/`;
}

export function addLeadingSlash(path: string): `/${string}` {
	if (path.startsWith('/')) {
		return path as `/${string}`;
	}
	return `/${path}`;
}

export type NormalizeUrlPath = `/${string}/` | '/';

export const normalizeUrlPath = (path: string): NormalizeUrlPath => {
	return addLeadingSlash(addTrailingSlash(path)) as `/${string}/`;
};

export const splitNormalizedUrlPath = (path: NormalizeUrlPath): string[] => {
	if (path === '/') {
		return [];
	}
	return path.slice(1, -1).split('/');
};

export function isSamePaths(urlA: string | URL, urlB: string | URL) {
	const pathA = urlA instanceof URL ? urlA.pathname : urlA;
	const pathB = urlB instanceof URL ? urlB.pathname : urlB;

	return addTrailingSlash(pathA) === addTrailingSlash(pathB);
}
