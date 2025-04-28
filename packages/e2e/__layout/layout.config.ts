import { defineLayout } from 'embodi/config';

const home = defineLayout({
  component: './Home.svelte',
  schema: ({ v, e }) =>
    v.objectAsync({
      title: v.string(),
      hero: e.image(),
      lang: v.string(),
      subtitle: v.string(),
      loadContent: v.optional(v.string())
    })
});

export const layouts = {
  home
};
