import { createRouter } from './router.js';
import { hydrate } from 'svelte';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';
import { runLoadAction } from './content-helper.js';
import { page as pageStore } from '$embodi/stores/internal';

const currentUrl = new URL(window.location.href).pathname;

const hydrateClient = async () => {
	const pageData = await createRouter().load(currentUrl);
	if (!pageData) return;
	const { html, Component, Layout } = pageData;
	const data = await runLoadAction(pageData);
	await renderHook({ data });
	pageStore.update((p) => ({ ...p, url: currentUrl }));
	hydrate(SvelteRoot, {
		target: document.getElementById('app')!,
		props: { Layout, data, html, Component }
	});
};

export default hydrateClient();
