<script context="module" lang="ts">
	import type { PageFile } from '$exports/types';
	import '$__embodi/components';
	import ClientEgine from '$core/elements/ClientEngine';
	const engine = new ClientEgine();

</script>

<script lang="ts">
	
	export let data: PageFile;
	
	let { content } = data;
</script>

<main class="relative">
	{#each content as data}
		<svelte:component this={engine.getComponent(data.type)} {data} {engine} />
	{/each}
</main>
