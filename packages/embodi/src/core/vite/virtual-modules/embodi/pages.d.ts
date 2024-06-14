/// <reference types="svelte" />
declare module '$embodi/pages' {
	export const pages: Record<string, () => Promise<{ Component: svelte.SvelteComponent, data: Record<string, any>, content: string }>>;
	export const source: string;
}