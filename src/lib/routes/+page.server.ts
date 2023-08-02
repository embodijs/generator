import { error } from '@sveltejs/kit';
import type { PageServerLoad } from '../../routes/[...page]/$types';
import { JsonFilesystem, type ContentManager } from '$lib/server/content-manager';
import type { PageFile } from '@embodi/types';
import RenderEngine from '$lib/server/elements/RenderEngine';
import { getPageFolder, runBeforeAll } from '$lib/server/elements/register';




let alreadyRun = false;

async function runOnce (helber: RenderEngine): Promise<void> {
	if(alreadyRun === true) return;
	await runBeforeAll(helber);
	alreadyRun = true;
}

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { page } = params.page === "" ? { page: "main" } : params;
	const path = getPageFolder();
	const pages: ContentManager = new JsonFilesystem<PageFile>(path);
	const helper = new RenderEngine(fetch, path);
	await runOnce(helper);
	console.info('Start loading page data: ', page);

	if (!(await pages.has(page))) {
		console.warn('No page data found');
		throw error(404);
	}
	const data = await pages.load(page);

	

	const manipulatedData: PageFile = {
		...data,
		content: await helper.compute(data.content)
	};

	console.info('Send page data');
	return manipulatedData;
};
