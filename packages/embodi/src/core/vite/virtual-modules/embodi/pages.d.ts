/// <reference types="svelte" />
declare module '$embodi/pages' {
	export const pages: Record<string, () => Promise<{ Component?: ConstructorOfATypedSvelteComponent, html?: string, Layout?: ConstructorOfATypedSvelteComponent, data: Record<string, any> }>>;
	export const source: string;
}