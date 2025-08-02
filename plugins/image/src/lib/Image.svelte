<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ImageFiles } from './schema.js';

	type Props = {
		images: ImageFiles;
	} & HTMLAttributes<HTMLImageElement>;

	let { images, ...props }: Props = $props();

	const getDefaultSrc = (images: ImageFiles) => {
		return images[0].src;
	};

	const createSrcset = (images: ImageFiles) => {
		const [_, ...formats] = images;
		return formats.map((image) => `${image.src} ${image.width}w`).join(', ');
	};
</script>

<img srcset={createSrcset(images)} src={getDefaultSrc(images)} {...props} />

<style>
	img {
		position: var(--position, relative);
		width: var(--width, 100%);
		height: var(--height);
	}
</style>
