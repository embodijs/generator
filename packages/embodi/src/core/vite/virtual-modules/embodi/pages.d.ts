/// <reference types="svelte" />
declare module '$embodi/pages' {
	export const pages: Record<string, import('../../../definitions/types.d.ts').PageImportFunction>;
	export const routes: Record<string, string>;
	export const source: string;
}
