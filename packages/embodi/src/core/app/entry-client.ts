import { createRouter } from './router-client.js';
import { hydrate, onMount } from 'svelte';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';
import { page as pageStore } from '$embodi/stores/internal';
import { page, update } from './state.svelte.js';

let clientRouter = createRouter();

const goto = async (href: string | URL | Location) => {
	try {
		const current = typeof href === 'string' ? href : href.pathname;
		const pageData = await clientRouter.load(current);
		await renderHook({ data: pageData.data });
		pageStore.update((p) => ({ ...p, url: current }));
		update(pageData);
		window.history.pushState({}, '', current);
	} catch (error) {
		console.error('Error during navigation:', error);
	}
};

const addLinkEvents = () => {
	window.addEventListener('popstate', () => goto(document.location));

	const linkElements = document.getElementsByTagName('a');
	const origin = window.location.origin;
	for (const el of linkElements) {
		const href = el?.getAttribute('href');
		if (el && href) {
			const linkURL = new URL(href, origin);

			if (linkURL.origin === origin) {
				el.addEventListener('mousedown', async (e) => {
					e.preventDefault();
					console.log('mousedown');
					await clientRouter.load(linkURL.pathname);
				});

				el.addEventListener('click', async (e) => {
					e.preventDefault();
					goto(linkURL);
				});
			}
		}
	}
};

const hydrateClient = async () => {
	const currentUrl = window.location.pathname;
	await goto(currentUrl);
	hydrate(SvelteRoot, {
		target: document.getElementById('app')!,
		props: { page }
	});
	addLinkEvents();
};

export default hydrateClient();
