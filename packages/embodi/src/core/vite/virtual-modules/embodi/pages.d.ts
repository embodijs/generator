/// <reference types="svelte" />
declare module 'virtual-page:*' {
  export default import('../../../definitions/types.d.ts').PageData
}

declare module '$embodi/pages' {
	export const pages: Record<string, import('../../../definitions/types.d.ts').PageImportFunction>;
	export const routes: Record<string, string>;
	export const source: string;
	export const VIRTUAL_PREFIX: typeof import('../../code-builder/load-content.ts').VIRTUAL_PAGE_PREFIX;

}
