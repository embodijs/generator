<script>
  import '../app.css';
  import Image from 'embodi/Image.svelte';

  let { data, children } = $props();
</script>

<main>
  <a href="/comp/">Link to comp</a>
  <a href="#marker">Scroll to end</a>
  <div class="img">
    <Image images={data.hero} alt="Hero" />
  </div>
  <h1>{data.title}</h1>
  <h2>{data.subtitle}</h2>
  {#if data.loadContent}
    <div>{data.loadContent}</div>
  {/if}
  {@render children?.()}
  <div id="marker">&nbsp;</div>
</main>

<style>
  .img {
    width: 50vw;
  }
  h2 {
    font-size: 3rem;
  }
</style>
