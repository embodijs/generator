<script>
  import '../app.css';
  import Image from 'embodi/Image.svelte';

  let { data, children } = $props();
</script>

<main>
  <div class="img">
    <Image images={data.hero} alt="Hero" />
  </div>
  <h1>{data.title}</h1>
  <h2>{data.subtitle}</h2>
  {#if data.loadContent}
    <div>{data.loadContent}</div>
  {/if}
  {@render children?.()}
</main>

<style>
  .img {
    width: 50vw;
  }
  h2 {
    font-size: 3rem;
  }
</style>
