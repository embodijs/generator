<script>
	let { Layout, Component, html, data } = $props();
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
