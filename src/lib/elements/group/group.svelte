<script lang="ts">
	import { getComponentFor } from '$lib/elements/register';
	import type { GroupElementData } from './types';

	export let data: GroupElementData;
	const { element, tailwindcss, content, design = 'default', width = 'default' } = data;
</script>

{#if element === 'ul'}
	<ul class="d-{design} w-{width} {tailwindcss}">
		{#each content as { type, ...props }}
			<li class="contents">
				<svelte:component this={getComponentFor(type)} data={props} />
			</li>
		{/each}
	</ul>
{:else}
	<svelte:element this={element} class="group-element {tailwindcss}">
		{#each content as { type, ...props }}
			<svelte:component this={getComponentFor(type)} data={props} />
		{/each}
	</svelte:element>
{/if}