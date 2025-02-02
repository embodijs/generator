<script>
	import { Github } from 'lucide-svelte';
</script>

<footer>

	<a
		title="Link to source code on github"
		href="https://github.com/embodijs/generator"
		target="_blank"
		rel="noopener noreferrer"><Github /></a
	>
	<span>This site is build with embodi by <a href="https://dropanote.de">CordlessWool</a></span>
</footer>

<style>
	@reference "tailwindcss/theme";
	footer {
		@apply my-3 flex flex-wrap items-center justify-center gap-y-5 text-zinc-600;
		@apply divide-x-2 divide-zinc-600;
	}

	footer > * {
		@apply px-5;
	}

	:global(.dark) {
		footer {
			@apply text-zinc-400;
		}
	}
	a {
		@apply underline-offset-4 hover:font-bold hover:underline;
		@apply transform transition-all duration-300 ease-in-out hover:scale-105;
	}
</style>
