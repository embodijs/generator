import { error } from "@sveltejs/kit";
import { EMBODI_CONTENT_PAGES } from "$env/static/private";
import type { PageServerLoad } from "./$types"
import { JsonFilesystem } from "$lib/server/content-manager";
import type { PageFile } from "@embodi/types";
import RenderEngine from "$lib/server/elements/RenderEngine";

const CONTENT_PATH = EMBODI_CONTENT_PAGES
const pages = new JsonFilesystem<PageFile>(CONTENT_PATH);

export const load: PageServerLoad = async ({ params, fetch }) => {
  const {page} = params;
  console.info('Start loading page data: ', page);
  
  if(!(await pages.has(page))){
    console.warn('No page data found');
    throw error(404)
  }
  const data = await pages.load(page);
  
  const helper = new RenderEngine(fetch, CONTENT_PATH)

  const manipulatedData: PageFile = {
    ...data,
    content: await helper.compute(data.content)
  }
  
  console.info('Send page data');
  return manipulatedData;

  

  
}
