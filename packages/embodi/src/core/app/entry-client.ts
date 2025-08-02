import { createRouter, PageDoesNotExistException } from './router-client.js';
import { hydrate } from 'svelte';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';
import { page as pageStore } from '$embodi/stores/internal';
import { page, update } from './state.svelte.js';
import { tick } from 'svelte';

let clientRouter = createRouter();

function isDynamicImportFetchError(error: unknown) {
	return (
		error instanceof Error &&
		(error.message.includes('Failed to fetch dynamically imported module') ||
			error.message.includes('Loading chunk') ||
			error.message.includes('Loading CSS chunk'))
	);
}

const goto = async (href: string | URL, options?: { pushState?: boolean; init?: boolean }) => {
	try {
		const current = window.location.pathname;
		const to = new URL(href, window.location.href);
		if (options?.init || to.pathname !== current) {
			const pageData = await clientRouter.load(to.pathname);
			const { Layout, Component, html, data } = pageData;
			await renderHook({ data: pageData.data });
			pageStore.update((p) => ({ ...p, url: to }));
			update({
				Layout,
				Component,
				html,
				data
			});
			await tick();
			addLinkEvents();
		}

		if (to.hash) {
			const element = document.getElementById(to.hash.slice(1));
			if (element) {
				element.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
			}
		} else {
			window.scrollTo(0, 0);
		}

		if ((!options || options.pushState !== false) && to.href !== window.location.href) {
			window.history.pushState({}, '', to);
		}
	} catch (error) {
		if (error instanceof PageDoesNotExistException) {
			return;
		}
		console.error('Error during navigation:', error);
		//trigger full reload and page switch
		if (isDynamicImportFetchError(error)) {
			window.location.replace(href);
		}
	}
};

const addLinkEvents = () => {
	window.addEventListener('popstate', () => {
		goto(window.location.href, { pushState: false, init: true });
	});
	const linkElements = document.querySelectorAll('a:not([data-embodi-reload])');
	for (const el of linkElements) {
		const href = el?.getAttribute('href');
		if (el && href) {
			const linkURL = new URL(href, window.location.href);
			const preload = async (e: Event) => {
				try {
					e.preventDefault();
					await clientRouter.preload(linkURL.pathname);
				} catch (error) {
					console.error('Error during preload:', error);
				}
			};

			const onClick = async (e: Event) => {
				e.preventDefault();
				await goto(linkURL);
			};

			if (linkURL.origin === origin) {
				el.addEventListener('pointerenter', preload);

				el.addEventListener('click', onClick);
			}
		}
	}
};

const hydrateClient = async () => {
	const currentUrl = window.location.href;
	await goto(currentUrl, { pushState: false, init: true });
	hydrate(SvelteRoot, {
		target: document.getElementById('app')!,
		props: { page }
	});
};

export default hydrateClient();
