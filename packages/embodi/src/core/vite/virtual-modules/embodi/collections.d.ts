declare module '$embodi/collections' {
	export function loadCollection(name: string): Record<string, unknown>[];
	export function loadCollections(max?: number): Record<string, unknown>[];
}