import type { SvelteComponent } from "svelte";

declare module '$embodi/pages' {
	export const content: string;
	export const data: Record<string, any>;
	export const Component: SvelteComponent
}