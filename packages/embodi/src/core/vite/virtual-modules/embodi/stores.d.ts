declare module '$embodi/stores/internal' {
	export const page: import('svelte/store').Writable<{ url: URL }>;
}

declare module '$embodi/stores' {
	export const page: import('svelte/store').Readable<{ url: URL }>;
}
