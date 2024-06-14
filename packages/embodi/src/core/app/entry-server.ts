import { createRouter } from "./router.js";
//@ts-ignore
import { entryClient } from "$embodi/paths";
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
  const head = manifest ? createHeadFromManifest(manifest, router.path(source, url).slice(1)) : '';
  const entryHead = manifest ? createHeadFromManifest(manifest, entryClient) : '';
  //const scripts = createScriptTags(manifes[router.path(url).slice(1)]);
  const app = await router.load(url);
  if(!app) return;
  // @ts-ignore
  const data = app.Component?.render({ data: app.data, content: app.content });
  if(!data) return;
  return {
    head: `${data.head ?? ''}\n${head}${entryHead}`,
    css: data.css.code === '' ? undefined : `<style>${data.css.code}</style>`,
    html: data.html
  }

}
