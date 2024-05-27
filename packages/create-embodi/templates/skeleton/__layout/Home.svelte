<script>
	import Counter from "./components/Counter.svelte";

	export let data;
	export let content;
</script>

<main>
	<h1>{data.title}</h1>
	<Counter />
	<p>{@html content}</p>
</main>
