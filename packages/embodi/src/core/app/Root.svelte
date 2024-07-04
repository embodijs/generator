<script lang="ts">
	export let Layout: ConstructorOfATypedSvelteComponent | undefined = undefined;
	export let Component: ConstructorOfATypedSvelteComponent | undefined = undefined;
	export let html: string | undefined = undefined;
	export let data: any;
</script>

{#if Layout}
	<svelte:component this={Layout} {data}>
		{#if Component}
			<svelte:component this={Component} {data} />
		{:else if html}
			{@html html}
		{/if}
	</svelte:component>
{:else if Component}
	<svelte:component this={Component} {data} />
{:else if html}
	{@html html}
{/if}
