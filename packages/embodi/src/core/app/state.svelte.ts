import type { SvelteComponent } from 'svelte';

export let page = new (class Page {
	html = $state.raw(null);
	Component = $state.raw(null);
	Layout = $state.raw(null);
	data = $state.raw({});
})();

export function update(newPage: {
	html?: string | null;
	Component?: SvelteComponent;
	Layout?: SvelteComponent;
	data?: Record<string, unknown>;
}) {
	Object.assign(page, newPage);
}
