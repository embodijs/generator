import { createRouter } from './router.js';
import { hydrate } from 'svelte';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';

const currentUrl = new URL(window.location.href).pathname;

const hydrateClient = async () => {
	const pageData = await createRouter().load(currentUrl);
	if (!pageData) return;
	const { html, Component, Layout, data } = pageData;
	await renderHook({ data });
	hydrate(SvelteRoot, {
		target: document.getElementById('app')!,
		props: { Layout, data, html, Component }
	});
};

export default hydrateClient();
