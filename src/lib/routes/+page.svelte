<script context="module" lang="ts">
	import type { PageFile } from '@embodi/types';
	import Group from '$lib/elements/group/group.svelte';
	import { registerComponent } from "$lib/elements/register";
	registerComponent<GroupElementData>('GROUP', Group );

</script>

<script lang="ts">
	import { getComponentFor } from '$lib/elements/register';
	import type { GroupElementData } from '$lib/elements/group/types';
	

	export let data: PageFile;
	let { content } = data;
</script>

<main class="relative">
	{#each content as { type, ...props }}
		<svelte:component this={getComponentFor(type)} data={props} />
	{/each}
</main>
