import { createRouter } from './router.js';
import { hydrate } from 'svelte';
import SvelteRoot from './Root.svelte';

const currentUrl = new URL(window.location.href).pathname;

export default createRouter()
	.load(currentUrl)
	.then((pageData) => {
		if (pageData === undefined) {
			throw new Error('Page not found');
		}
		return pageData;
	})
	.then(({ html, Component, Layout, data }) => {
		return hydrate(SvelteRoot, {
			target: document.getElementById('app')!,
			props: { Layout, data, html, Component }
		});
	});
