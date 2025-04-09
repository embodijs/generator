<script>
  import '../app.css';

  let { data, children } = $props();
</script>

<main>
  <h1>{data.title}</h1>
  <h2>{data.subtitle}</h2>
  <div>{data.loadContent}</div>
  {@render children?.()}
</main>

<style>
    h2 {
        font-size: 3rem;
    }
</style>
