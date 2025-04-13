<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
  import type { ImageFiles } from '../core/app/entry-server.js';

  type Props = {
    images: ImageFiles
  } & HTMLAttributes<HTMLImageElement>

  let { images, ...props }: Props = $props();

  const getDefaultSrc = (images: ImageFiles) => {
    return images[0].src;
  }

  const createSrcset = (images: ImageFiles) => {
    const [original, ...formats] = images;
    return formats.map((image) => `${image.src} ${image.width}w`).join(', ');
  };

</script>

<img srcset={createSrcset(images)} src={getDefaultSrc(images)} {...props}>
