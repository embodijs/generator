<script lang="ts">
    import RenderComponent from "$exports/renderComponent.svelte";
	import type { PageFile } from "$exports/types";
    export let data: PageFile;
    const { content } = data;
</script>

{#each content as data}
<RenderComponent {data}/>
{/each}
