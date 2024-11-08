import { createRouter } from './router.js';
import { entryClient } from '$embodi/paths';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';
import { render as renderSvelte } from 'svelte/server';
import type { Manifest } from 'vite';
import { addLeadingSlash } from '../utils/paths.js';
import { runLoadAction } from './content-helper.js';

const router = createRouter();

const createScriptTag = (url: string) => {
	return `<script type="module" src="${addLeadingSlash(url)}" defer></script>`;
};

const createStyleTag = (url: string) => {
	return `<link rel="stylesheet" href="${addLeadingSlash(url)}" />`;
};

const createHeadFromManifest = (manifest: Manifest, entry: string): string => {
	const current = manifest[entry];
	const heads = [];
	heads.push(createScriptTag(current.file));

	if (current.css) {
		current.css.forEach((element: string) => {
			heads.push(createStyleTag(element));
		});
	}

	if (current.imports) {
		const imports = current.imports.map((url: string) => {
			return createHeadFromManifest(manifest, url);
		});
		heads.push(...imports);
	}

	return heads.flat().join('\n');
};

export async function render(source: string, url: string, manifest?: Manifest) {
	const head = manifest ? createHeadFromManifest(manifest, await router.path(url)) : '';
	const entryHead = manifest ? createHeadFromManifest(manifest, entryClient) : '';
	//const scripts = createScriptTags(manifes[router.path(url).slice(1)]);
	const pageData = await router.load(url);
	if (!pageData) return;
	const { html, Component, Layout } = pageData;
	const data = runLoadAction(pageData);

	await renderHook({ data });
	// @ts-ignore
	const rendered = renderSvelte(SvelteRoot, { props: { html, Component, Layout, data } });
	if (!rendered) return;
	return {
		head: `${rendered.head ?? ''}\n${head}${entryHead}`,
		// css: data.css.code === '' ? undefined : `<style>${data.css.code}</style>`,
		html: rendered.body
	};
}
