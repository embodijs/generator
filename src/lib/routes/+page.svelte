<script context="module" lang="ts">
	import type { PageFile } from '$exports/types';
	import { getComponentFor } from '$core/elements/register.js';
</script>

<script lang="ts">
	
	export let data: PageFile;
	let { content } = data;
</script>

<main class="relative">
	{#each content as data}
		<svelte:component this={getComponentFor(data.type)} {data} />
	{/each}
</main>
