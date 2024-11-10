declare module '$embodi/collections?*' {
	export const meta: Array<import('../../utils/collections.ts').CollectionMeta>;
	export const collections: Array<any>;
}

declare module '$embodi/collections' {
	export const meta: Array<import('../../utils/collections.ts').CollectionMeta>;
	export const collections: Array<any>;
}
