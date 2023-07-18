<script lang="ts">
import type { PageData } from "./$types";



  export let data: PageData;
  //export let pageData: Omit<PageData, 'type'>;
  
   
</script>

{@html data.page}