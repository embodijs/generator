import * as v from 'valibot';
import { defineLayout } from 'embodi/config';

const home = defineLayout({
  component: './Home.svelte',
  schema: v.object({
    title: v.string(),
    subtitle: v.string(),
    loadContent: v.string()
  })
});

export const layouts = {
  home
};
