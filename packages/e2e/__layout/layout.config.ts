import { defineLayout } from 'embodi/config';

const home = defineLayout({
  component: './Home.svelte',
  schema: ({ v, e }) =>
    v.objectAsync({
      title: v.string(),
      hero: e.image(),
      subtitle: v.string(),
      loadContent: v.string()
    })
});

export const layouts = {
  home
};
