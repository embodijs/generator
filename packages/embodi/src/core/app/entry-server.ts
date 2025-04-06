import { createRouter } from './router.js';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';
import { render as renderSvelte } from 'svelte/server';
import type { Manifest } from 'vite';
import { addLeadingSlash } from './utils/paths.js';
import { runLoadAction } from './content-helper.js';
import { page as pageStore } from '$embodi/stores/internal';

const router = createRouter();

const createScriptTag = (url: string) => {
	return `<script type="module" src="${addLeadingSlash(url)}" defer></script>`;
};

const createStyleTag = (url: string) => {
	return `<link rel="stylesheet" href="${addLeadingSlash(url)}" />`;
};

const followImports = (
	manifest: Manifest,
	entry: string,
	imports: Set<string> = new Set(),
	css: Set<string> = new Set()
) => {
	const current = manifest[entry.replaceAll('\\', '/')];

	imports.add(current.file);
	if (current.imports) {
		current.imports.forEach((url: string) => {

			followImports(manifest, url, imports, css);
		});
	}

	if (current.css) {
		current.css.forEach((url: string) => {
			css.add(url);
		});
	}
	return {
		css,
		imports
	};
};

const createHeadFromManifest = (manifest: Manifest, entry: string): string => {
	const heads = [];
	const { css, imports } = followImports(manifest, entry);
	heads.push(...Array.from(css).map(createStyleTag));
	heads.push(...Array.from(imports).map((url) => createScriptTag(url)));

	return heads.flat().join('\n');
};

export async function render(source: string, url: string, manifest?: Manifest) {
	const head = manifest ? createHeadFromManifest(manifest, `embodi-page:${url.slice(0,-1)}`) : '';
	//const entryHead = manifest ? createHeadFromManifest(manifest, entryClient) : '';
	//const scripts = createScriptTags(manifes[router.path(url).slice(1)]);
	const pageData = await router.load(url);
	console.log({ pageData })
	if (!pageData) return;
	const { html, Component, Layout } = pageData;
	const data = await runLoadAction(pageData);

	await renderHook({ data });
	pageStore.update((p) => ({ ...p, url }));
	// @ts-ignore
	const rendered = renderSvelte(SvelteRoot, { props: { html, Component, Layout, data } });
	if (!rendered) return;
	return {
		head: `${rendered.head ?? ''}\n${head}`,
		// css: data.css.code === '' ? undefined : `<style>${data.css.code}</style>`,
		html: rendered.body
	};
}
