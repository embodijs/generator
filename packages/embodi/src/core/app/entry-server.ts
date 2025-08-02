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
import { resolve } from 'path';
import { FileManager } from '../vite/utils/FileManager.js';
import { extname } from 'path';
import { src, dest } from '$embodi/config';
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

type ImageFormat =
	| {
			width?: number;
			format: 'png';
	  }
	| {
			width?: number;
			format: 'webp' | 'jpg';
			quality?: number;
	  };

export type ImageFile = {
	width: number;
	height: number;
	src: string;
};

export type DefaultImageFile = {
	original: true;
	src: string;
};

export type ImageFiles = [DefaultImageFile, ...ImageFile[]];

const generateImageWidths = (widths: number[], format: ImageFormat['format']): ImageFormat[] => {
	return widths.map((width) => ({ width, format }));
};

const replaceFileType = (path: string, newFormat: string) => {
	const ext = extname(path);
	const regEx = new RegExp(`${ext}$`);
	return path.replace(regEx, `.${newFormat}`);
};

const getFileType = (path: string) => {
	const ext = extname(path);
	return ext.slice(1);
};

const loadImage = (path: string) => {
	const image = sharp(resolve(process.cwd(), src.assets, path));
	return image;
};

const transformImage = (path: string, imageFormat: ImageFormat) => {
	const { width, format } = imageFormat;
	let image = loadImage(path).autoOrient();

	if (width) {
		image = image.resize({
			width
		});
	}

	if (format) {
		if (format === 'png') {
			image = image.png();
		} else if (format === 'webp') {
			image = image.webp({
				quality: imageFormat.quality ?? 80
			});
		} else if (format === 'jpg') {
			image = image.jpeg({
				quality: imageFormat.quality ?? 80
			});
		}
	}

	return image;
};

const transformImageWithStore = async (
	fileManager: FileManager,
	path: string,
	imageFormat: ImageFormat
): Promise<ImageFile> => {
	const transformedImage = transformImage(path, imageFormat);

	const newPath = replaceFileType(path, imageFormat.format);
	const { info, data } = await transformedImage.toBuffer({ resolveWithObject: true });
	const assetPath = fileManager.addAsset(newPath, data, `image/${imageFormat.format}`);
	return {
		width: info.width,
		height: info.height,
		src: assetPath
	};
};

const transformDefaultImageWithStore = async (
	fileManager: FileManager,
	path: string
): Promise<DefaultImageFile> => {
	const image = loadImage(path).autoOrient().resize({
		width: 2000
	});

	const imageBuffer = await image.toBuffer();
	const assetPath = fileManager.addAsset(path, imageBuffer, `image/${getFileType(path)}`);
	return {
		original: true,
		src: assetPath
	};
};

export const prepareE = (fileManager: FileManager) => ({
	image: (formats: ImageFormat[] = generateImageWidths([300, 700, 1300, 2000], 'webp')) =>
		v.transformAsync(async (value: string) => {
			const path = value.slice('$assets/'.length);
			return [
				await transformDefaultImageWithStore(fileManager, path),
				...(await Promise.all(
					formats.map((format) => transformImageWithStore(fileManager, path, format))
				))
			] satisfies ImageFiles;
		})
});

export function hasRoute(url: string) {
	return !!router.path(url);
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
	Layout: Component;
	loadPrehandler: PrehandlerLoadImport;
	url: URL;
	data: AnyObject;
	html: string;
}) {
	const { Layout, loadPrehandler, url } = elements;
	let { html, data } = elements;
	if (!Layout) {
		return { html, data };
	}
	const { enrich, schema } = await loadPrehandler();
	({ html, data } = await runEnrich(enrich, { html, data, url }));
	data = await validateData(schema, data);
	return { html, data };
}

export async function render(url: string, manifest?: Manifest) {
	const fileManager = FileManager.getInstance();
	fileManager.setBasePath({ src, dest });
	const head = manifest
		? createHeadFromManifest(manifest, `${VIRTUAL_PREFIX}${url.slice(0, -1)}`)
		: '';

	const pageData = await router.load(url);
	if (!pageData) return;
	const { Component, Layout } = pageData;
	let data = await runLoadAction({ ...pageData, url });
	let html: string;
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
	fileManager.addPage(url, {
		head: `${rendered.head ?? ''}\n${head}`,
		html: rendered.body,
		data
	});
	return true;
}
