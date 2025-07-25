import { createRouter } from './router-client.js';
import { hydrate } from 'svelte';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';
import { page as pageStore } from '$embodi/stores/internal';
import { page, update } from './state.svelte.js';
import { tick } from 'svelte';

let clientRouter = createRouter();

const goto = async (href: string | URL | Location, options?: { pushState?: boolean }) => {
	try {
		const current = typeof href === 'string' ? href : href.pathname;
		const pageData = await clientRouter.load(current);
		const { Layout, Component, html, data } = pageData;
		await renderHook({ data: pageData.data });
		pageStore.update((p) => ({ ...p, url: current }));
		update({
			Layout,
			Component,
			html,
			data
		});
		if (!options || options.pushState) {
			window.history.pushState({}, '', current);
		}
		await tick();
		window.scrollTo(0, 0);
		addLinkEvents();
	} catch (error) {
		console.error('Error during navigation:', error);
	}
};

const addLinkEvents = () => {
	window.addEventListener('popstate', () => {
		goto(document.location, { pushState: false });
	});
	const linkElements = document.querySelectorAll('a:not([data-embodi-reload])');
	for (const el of linkElements) {
		const href = el?.getAttribute('href');
		if (el && href) {
			const linkURL = new URL(href, window.location.href);

			if (linkURL.origin === origin) {
				el.addEventListener('mousedown', async (e) => {
					e.preventDefault();
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
	await goto(currentUrl, { pushState: false });
	hydrate(SvelteRoot, {
		target: document.getElementById('app')!,
		props: { page }
	});
};

export default hydrateClient();
