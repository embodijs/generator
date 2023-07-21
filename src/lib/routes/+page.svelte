<script context="module" lang="ts">
	import type { EmbodiComponent, PageFile } from '@embodi/types';
	import * as group from '$lib/elements/group/component';
	import { registerComponent } from "$lib/elements/register";
	registerComponent('GROUP', <EmbodiComponent>group );

</script>

<script lang="ts">
	import { getComponentFor } from '$lib/elements/register';
	

	export let data: PageFile;
	let { content } = data;
</script>

<main class="relative">
	{#each content as { type, ...props }}
		<svelte:component this={getComponentFor(type)} data={props} />
	{/each}
</main>
