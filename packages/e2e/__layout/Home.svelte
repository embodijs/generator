<script>
  import '../app.css';
  import { Image } from '@embodi/image/client';

  let { data, children } = $props();
</script>

<main>
  <a href="/comp/">Link to comp</a>
  <a href="#marker">Scroll to end</a>
  <div class="img">
    <Image images={data.hero} sizes="50vw" alt="Hero" />
  </div>
  <h1>{data.title}</h1>
  <h2>{data.subtitle}</h2>
  {#if data.loadContent}
    <div>{data.loadContent}</div>
  {/if}
  <div class="content">
    {@render children?.()}
  </div>
  <div id="marker">&nbsp;</div>
</main>

<style>
  .img {
    width: 50vw;
  }
  h2 {
    font-size: 3rem;
  }

  main {
    max-width: 100vw;
  }

  .content :global(*) {
    max-width: 100%;
  }
</style>
