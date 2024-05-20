import '/app.css'
//import App from './App.svelte'
import { createRouter } from './router.js';

const currentUrl = new URL(window.location.href).pathname;

createRouter()
  .load(currentUrl)
  .then(({Component, data, content}) => {
    new Component({
      props: {
        data,
        content
      },
      target: document.getElementById('app'),
      hydrate: true
    });
  });