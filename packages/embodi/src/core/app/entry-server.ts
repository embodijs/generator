import { createRouter } from './router-server.js';
import { renderHook } from '$embodi/hooks';
import SvelteRoot from './Root.svelte';
import { render as renderSvelte } from 'svelte/server';
import type { Manifest } from 'vite';
import { addLeadingSlash } from './utils/paths.js';
import { runLoadAction } from './content-helper.js';
import { page as pageStore } from '$embodi/stores/internal';
import { VIRTUAL_PREFIX } from '$embodi/pages';
import * as v from 'valibot';
import { resolve } from 'path';
import { FileManager } from '../vite/utils/FileManager.js';
import { src, dest, origin } from '$embodi/config';
import { page, update } from './state.svelte.js';
import type { DataSchema } from 'exports/layout.js';
import type {
	AnyObject,
	EnrichAction,
	LayoutEvent,
	PrehandlerLoadImport
} from '../definitions/types.js';
import type { Component } from 'svelte';

const router = createRouter();
export { FileManager };
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

export function hasRoute(url: string) {
	return !!router.path(new URL(url, origin));
}

export function resolvePath(path: string) {
	if (path.startsWith('$assets/')) {
		return resolve(process.cwd(), src.assets, path.slice('$assets/'.length));
	}
	return resolve(path);
}

export async function runEnrich(
	enrich: EnrichAction | undefined,
	{ html, data, url }: Pick<LayoutEvent, 'url' | 'html' | 'data'>
) {
	if (!enrich) {
		return Promise.resolve({ html, data });
	}
	return enrich({
		html,
		url,
		data,
		helper: {
			resolvePath,
			fileManager: FileManager.getInstance()
		}
	});
}

export function validateData<T extends AnyObject>(schema: DataSchema | undefined, data: T) {
	if (!schema) {
		return data;
	}
	return v.parseAsync(schema, data);
}

export async function prehandle(elements: {
	Layout?: Component | undefined | null;
	loadPrehandler: PrehandlerLoadImport;
	url: URL;
	data: AnyObject;
	html?: string | undefined | null;
}) {
	const { Layout, loadPrehandler, url } = elements;
	let { html, data } = elements;
	if (!Layout) {
		return { html, data };
	}
	const { enrich, schema } = await loadPrehandler();
	({ html, data } = await runEnrich(enrich, { html: html ?? null, data, url }));
	data = await validateData(schema, data);
	return { html, data };
}

export async function render(path: string, manifest?: Manifest) {
	const fileManager = FileManager.getInstance();
	const url = new URL(path, origin);
	fileManager.setBasePath({ src, dest });
	const head = manifest
		? createHeadFromManifest(manifest, `${VIRTUAL_PREFIX}${url.pathname.slice(0, -1)}`)
		: '';

	const pageData = await router.load(url);
	if (!pageData) return;
	const { Component, Layout } = pageData;
	let data = await runLoadAction({ ...pageData, url });
	let html: string | null | undefined;
	({ data, html } = await prehandle({ ...pageData, data, url }));
	await renderHook({ data });
	pageStore.update((p) => ({ ...p, url }));

	update({
		html,
		Layout,
		Component,
		data
	});
	// @ts-ignore
	const rendered = renderSvelte(SvelteRoot, {
		props: { page }
	});
	if (!rendered) return false;
	fileManager.addPage(url.pathname, {
		head: `${rendered.head ?? ''}\n${head}`,
		html: rendered.body,
		data
	});
	return true;
}
