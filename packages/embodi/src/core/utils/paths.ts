export function isRelativePath(path: string) {
	return path.startsWith('./') || path.startsWith('../');
}