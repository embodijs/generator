import type { PageElements } from '../definitions/types.js';

export let page: PageElements = new (class Page implements PageElements {
	html = $state.raw(null);
	Component = $state.raw(null);
	Layout = $state.raw(null);
	data = $state.raw({});
})();

export function update(newPage: Partial<PageElements>) {
	Object.assign(page, newPage);
}
