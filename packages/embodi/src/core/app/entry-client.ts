import { createRouter } from './router-client.js';
import { hydrate } from 'svelte';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';
import { page as pageStore } from '$embodi/stores/internal';

const hydrateClient = async () => {
	const currentUrl = window.location.pathname;
	const pageData = await createRouter().load(currentUrl);
	if (!pageData) return;
	const { html, Component, Layout, data } = pageData;
	await renderHook({ data });
	pageStore.update((p) => ({ ...p, url: currentUrl }));
	hydrate(SvelteRoot, {
		target: document.getElementById('app')!,
		props: { Layout, data, html, Component }
	});
};

export default hydrateClient();
