<script lang="ts">
  import { getComponentFor } from '$lib/elements';
  import type { PageFile } from '@embodi/types';

  export let data: PageFile;
  let { content } = data;

</script>


<main class="relative">
    {#each content as {type, ...props}}
      <svelte:component this={getComponentFor(type)} data={props}/>
    {/each}
</main>

