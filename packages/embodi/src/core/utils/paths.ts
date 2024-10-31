export function isRelativePath(path: string) {
	return path.startsWith('./') || path.startsWith('../');
}

export function addTrailingSlash(path: string) {
	if (path.endsWith('/')) {
		return path;
	}
	return `${path}/`;
}

export function isSamePaths(urlA: string | URL, urlB: string | URL) {
	const pathA = urlA instanceof URL ? urlA.pathname : urlA;
	const pathB = urlB instanceof URL ? urlB.pathname : urlB;

	return addTrailingSlash(pathA) === addTrailingSlash(pathB);
}
