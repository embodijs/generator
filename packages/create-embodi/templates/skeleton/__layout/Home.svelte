<script>
  import '../app.css';

  let { data, children } = $props();
</script>

<main>
  <h1>{data.title}</h1>
  {@render children?.()}
</main>
