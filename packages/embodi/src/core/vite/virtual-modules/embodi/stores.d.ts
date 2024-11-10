declare module '$embodi/stores/internal' {
	export const page: import('svelte/store').Writable<{ url: string }>;
}

declare module '$embodi/stores' {
	export const page: import('svelte/store').Readable<{ url: string }>;
}
