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
import sharp from 'sharp';
import { resolve } from 'path/posix';
import { FileManager } from '../vite/utils/FileManager.js';

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

export const prepareE = (fileManager: FileManager) => ({
	image: () =>
		v.transformAsync(async (value: string) => {
			const path = value.slice('$assets/'.length);
			const buffer = await sharp(resolve(process.cwd(), './assets', path))
				.resize(100, 100)
				.toBuffer()
			const assetPath = fileManager.addAsset(path, buffer);
			console.log({ assetPath });
			return [[100, assetPath]];
		});
});

export async function render(url: string, fileManager: FileManager, manifest?: Manifest) {
	const head = manifest
		? createHeadFromManifest(manifest, `${VIRTUAL_PREFIX}${url.slice(0, -1)}`)
		: '';

	const pageData = await router.load(url);
	if (!pageData) return;
	const { html, Component, Layout, layoutDefinition } = pageData;
	const unevaluatedData = await runLoadAction(pageData);
	const data = await v.parseAsync(
		layoutDefinition.schema({
			v,
			e: prepareE(fileManager)
		}),
		unevaluatedData
	);

	await renderHook({ data });
	pageStore.update((p) => ({ ...p, url }));
	// @ts-ignore
	const rendered = renderSvelte(SvelteRoot, {
		props: { html, Component, Layout, data }
	});
	if (!rendered) return false;
	fileManager.addPage(url, {
		head: rendered.head ?? '',
		html: rendered.body,
		data
	});
	return true;
}
