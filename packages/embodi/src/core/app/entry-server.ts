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

const loadImage = (path: string) => {
	const image = sharp(resolve(process.cwd(), src.assets, path));
	return image;
};

const transformImage = async (path: string, imageFormat: ImageFormat) => {
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

	return image.toBuffer();
};

const transformImageWithStore = async (
	fileManager: FileManager,
	path: string,
	imageFormat: ImageFormat
): Promise<ImageFile> => {
	const transformedImage = await transformImage(path, imageFormat);
	const newPath = replaceFileType(path, imageFormat.format);
	const assetPath = fileManager.addAsset(newPath, transformedImage);
	return {
		width: imageFormat.width,
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
	const assetPath = fileManager.addAsset(path, imageBuffer);
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

export async function render(url: string, fileManager: FileManager, manifest?: Manifest) {
	fileManager.setBasePath({ src, dest });
	const head = manifest
		? createHeadFromManifest(manifest, `${VIRTUAL_PREFIX}${url.slice(0, -1)}`)
		: '';

	const pageData = await router.load(url);
	if (!pageData) return;
	const { html, Component, Layout, layoutDefinition } = pageData;
	const unevaluatedData = await runLoadAction(pageData);
	const data = layoutDefinition?.hasOwnProperty('schema')
		? await v.parseAsync(
				layoutDefinition.schema({
					v,
					e: prepareE(fileManager)
				}),
				unevaluatedData
			)
		: unevaluatedData;

	await renderHook({ data });
	pageStore.update((p) => ({ ...p, url }));
	// @ts-ignore
	const rendered = renderSvelte(SvelteRoot, {
		props: { html, Component, Layout, data }
	});
	if (!rendered) return false;
	fileManager.addPage(url, {
		head: `${rendered.head ?? ''}\n${head}`,
		html: rendered.body,
		data
	});
	return true;
}
