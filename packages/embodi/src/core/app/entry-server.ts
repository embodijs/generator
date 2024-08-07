import { createRouter } from "./router.js";
import { entryClient } from "$embodi/paths";
import SvelteRoot from "./Root.svelte";
import type { Manifest } from "vite";


const router = createRouter();


const createScriptTag = (url: string) => {
  return `<script type="module" src="/${url}" defer></script>`;
}

const createStyleTag = (url: string) => {
  return `<link rel="stylesheet" href="/${url}" />`;
}


const createHeadFromManifest = (manifest: Manifest, entry: string): string => {
  const current = manifest[entry];
  const heads = [];
  heads.push(createScriptTag(current.file));

  if(current.css) {
   current.css.forEach((element: string) => {
      heads.push(createStyleTag(element));
    })
   }


  if(current.imports) {
    const imports = current.imports.map((url: string) => {
       return createHeadFromManifest(manifest, url);
    });
    heads.push(...imports);
  }

  return heads.flat().join('\n');
}

export async function render(source: string, url: string, manifest?: Manifest) {
  const head = manifest ? createHeadFromManifest(manifest, (await router.path(url))) : '';
  const entryHead = manifest ? createHeadFromManifest(manifest, entryClient) : '';
  //const scripts = createScriptTags(manifes[router.path(url).slice(1)]);
  const app = await router.load(url);
  if(!app) return;
  // @ts-ignore
  const data = SvelteRoot.render(app);
  if(!data) return;
  return {
    head: `${data.head ?? ''}\n${head}${entryHead}`,
    css: data.css.code === '' ? undefined : `<style>${data.css.code}</style>`,
    html: data.html
  }

}
