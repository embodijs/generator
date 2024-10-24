<script lang="ts">
	import type { Snippet, SvelteComponent } from 'svelte';

	interface RootProps {
		Layout?: SvelteComponent;
		Component?: SvelteComponent;
		html?: string;
		data: any;
	}

	let { Layout, Component, html, data }: RootProps = $props();
</script>

{#if Layout}
	<Layout {data}>
		{#if Component}
			<Component {data} />
		{:else if html}
			{@html html}
		{/if}
	</Layout>
{:else if Component}
	<Component {data} />
{:else if html}
	{@html html}
{/if}
