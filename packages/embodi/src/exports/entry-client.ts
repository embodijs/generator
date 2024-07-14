import { createRouter } from '../core/app/router.js';
import SvelteRoot from '../core/app/Root.svelte';

const currentUrl = new URL(window.location.href).pathname;

createRouter()
  .load(currentUrl)
  .then((pageData) => {
    if(pageData === undefined) {
      throw new Error("Page not found");
    }
    return pageData;
  })
  .then(({html, Component, Layout, data}) => {
    new SvelteRoot({
      props: {
        Layout,
        data,
        html,
        Component
      },
      target: document.getElementById('app')!,
      hydrate: true
    });



  });



