<script lang="ts">
	import type { PageData } from '../definitions/types.js';

	let { page }: { page: PageData } = $props();
</script>

{#if page.Layout}
	<page.Layout data={page.data}>
		{#if page.Component}
			<page.Component data={page.data} />
		{:else if page.html}
			{@html page.html}
		{/if}
	</page.Layout>
{:else if page.Component}
	<page.Component data={page.data} />
{/if}
