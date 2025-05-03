export let page = new (class Page {
	html = $state.raw(null);
	Component = $state.raw(null);
	Layout = $state.raw(null);
	data = $state.raw({});
})();

export function update(newPage) {
	Object.assign(page, newPage);
}
