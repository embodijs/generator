import type { PageData } from 'core/vite/code-builder/load-content.js';
import type { SvelteComponent } from 'svelte';

export let page: PageData = new (class Page implements PageData {
	html = $state.raw(null);
	Component = $state.raw(null);
	Layout = $state.raw(null);
	data = $state.raw({});
})();

export function update(newPage: Partial<PageData>) {
	Object.assign(page, newPage);
}
