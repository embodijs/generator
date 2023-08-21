<script lang="ts" context="module">
	import type ClientEgine from "$core/elements/ClientEngine";
    import type { ElementData } from "./types";
    import setup from "$__embodi/client/setup";
    const engine: ClientEgine = setup();
</script>

<script lang="ts">
    export let data: ElementData;
</script>


<svelte:component this={engine.getComponent(data)} data={engine.compute(data)} />
