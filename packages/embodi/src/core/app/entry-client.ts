import '/app.css'
//import App from './App.svelte'
import { createRouter } from './router.js';

const currentUrl = new URL(window.location.href).pathname;

createRouter()
  .load(currentUrl)
  .then((pageData) => {
    if(pageData === undefined) {
      throw new Error("Page not found");
    }
    return pageData;
  })
  .then(({Component, data, content}) => {
    if(Component === undefined) {
      throw new Error("Component not found");
    }

    new Component({
      props: {
        data,
        content
      },
      target: document.getElementById('app'),
      hydrate: true
    });



  });



