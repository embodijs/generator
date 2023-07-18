<script lang="ts">
  import { getComponentFor } from '$lib/elements';
	import type { GroupElementData } from './types';

  export let data: GroupElementData;
  const {element, class: elementStyle, content, design = 'default', width = 'default'} = data;
</script>


{#if element === 'ul'}
  <ul class="d-{design} w-{width} {elementStyle}">
    {#each content as {type, ...props}}
      <li class="contents">
        <svelte:component this={getComponentFor(type)} data={props}/>
      </li>
    {/each}
  </ul>
{:else}
  <svelte:element this={element} class="e-{element} d-{design} w-{width} {elementStyle}">
    {#each content as {type, ...props}}
      <svelte:component this={getComponentFor(type)} data={props}/>
    {/each}
  </svelte:element>
{/if}


<style lang="postcss">

  .e-section {
    @apply mx-auto;
  }
  .d-default {
    @apply py-7 px-3;
  }
  .w-default {
    max-width: var(--default-content-width);
  }
</style>