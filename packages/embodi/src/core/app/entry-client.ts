import { createRouter } from './router-client.js';
import { hydrate } from 'svelte';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';
import { page as pageStore } from '$embodi/stores/internal';
import { page, update } from './state.svelte.js';
import { tick } from 'svelte';

let clientRouter = createRouter();

const goto = async (href: string | URL, options?: { pushState?: boolean; init?: boolean }) => {
	try {
		const current = window.location.pathname;
		const to = new URL(href, window.location.href);
		console.log({ options, to, current, href: window.location.href });
		if (options?.init || to.pathname !== current) {
			console.log('Navigating to:', to.pathname);
			const pageData = await clientRouter.load(to.pathname);
			const { Layout, Component, html, data } = pageData;
			await renderHook({ data: pageData.data });
			pageStore.update((p) => ({ ...p, url: to.href }));
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
			console.log('scroll', element, to.hash);
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
		console.error('Error during navigation:', error);
	}
};

const addLinkEvents = () => {
	window.addEventListener('popstate', () => {
		goto(document.location.href, { pushState: false });
	});
	const linkElements = document.querySelectorAll('a:not([data-embodi-reload])');
	for (const el of linkElements) {
		const href = el?.getAttribute('href');
		if (el && href) {
			const linkURL = new URL(href, window.location.href);
			const onMouseDown = async (e: Event) => {
				e.preventDefault();
				await clientRouter.load(linkURL.pathname);
			};

			const onClick = async (e: Event) => {
				e.preventDefault();
				goto(linkURL);
			};

			if (linkURL.origin === origin) {
				el.removeEventListener('mousedown', onMouseDown);
				el.addEventListener('mousedown', onMouseDown);

				el.removeEventListener('click', onClick);
				el.addEventListener('click', onClick);
			}
		}
	}
};

const hydrateClient = async () => {
	const currentUrl = window.location.pathname;
	await goto(currentUrl, { pushState: false, init: true });
	hydrate(SvelteRoot, {
		target: document.getElementById('app')!,
		props: { page }
	});
};

export default hydrateClient();
