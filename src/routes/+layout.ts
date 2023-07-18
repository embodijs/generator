import type { LayoutLoad } from "./$types";



export const prerender = false;
export const load: LayoutLoad = async ({fetch}) => {
  // const response = await fetch('/config.json');
  // const config = await response.json();
  // return config
}
