<script>
	import { onMount } from 'svelte';

	let { page, onHydrated } = $props();
</script>

{#if page.Layout}
	<page.Layout data={page.data}>
		{#if page.Component}
			<page.component data={page.data} />
		{:else if page.html}
			{@html page.html}
		{/if}
	</page.Layout>
{:else if page.Component}
	<page.Component data={page.data} />
{/if}
