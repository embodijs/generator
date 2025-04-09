<script>
  import Header from './comp/Header.svelte';
  import Footer from './comp/Footer.svelte';
  import InputFrame from './comp/InputFrame.svelte';
  import Input from './comp/Input.svelte';
  import Button from './comp/Button.svelte';
  import { Send, Mail } from 'lucide-svelte';
  import '../app.css';

  let { data, children } = $props();
</script>

<Header showName={false}></Header>
<main>
  <div class="markdown">
    {@render children?.()}
  </div>
  <form method="POST" action={import.meta.env.VITE_FORMURL}>
    <InputFrame>
      <Mail />
      <Input name="email" placeholder="Your mail address" />
      <Button type="sumbit"><Send size={16} /></Button>
    </InputFrame>
  </form>
</main>
<Footer></Footer>

<style>
  @reference "tailwindcss/theme";

  main {
    @apply max-w-3xl mx-auto p-4  min-h-full;
    @apply flex flex-col gap-4 items-center justify-center;
  }

  .markdown {
    @apply text-center;
  }

  :global(h1) {
    @apply text-5xl font-bold mb-4;
  }

  :global(h2) {
    @apply text-3xl font-bold mb-4;
  }
</style>
