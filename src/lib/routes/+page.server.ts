import { error } from '@sveltejs/kit';
import type { PageServerLoad } from '../../routes/[...page]/$types';
import { LoadException, PageLoadException } from '$exceptions/load.js';
import ServerEngine from '$core/elements/ServerEngine.server';
import type { PageFile } from '$exports';
import LoadEngine from '$core/elements/LoadEngine.server';

import { pages, contentPath } from '$__embodi/data';
import setup from '$__embodi/setup';

setup();

class ServerActionReturnException {
	constructor(public readonly data: unknown) {}
}

async function runServerActions(request: ServerEngine['svelteRequestEvent']) {
	if(ServerEngine.hasActions()) {
		console.info('Execute actions');
		const serverEngine = new ServerEngine(contentPath, request);
		const ret = await serverEngine.compute();
		if(ret != null) {
			throw new ServerActionReturnException(ret);
		}
	}
}

async function getPageBySlug(slug: string): Promise<PageFile> {
	const data = pages.find(({slug: s}) => s === slug);
	
	if(data == null){ 
		throw new PageLoadException(404 , `No page with slug ${slug} found`);
	}

	return data;
}

async function getComputedPage(slug: string, svelteFetch: typeof fetch): Promise<PageFile> {
	const data = await getPageBySlug(slug);
	if(LoadEngine.hasActions()) {
		const loadEngine = new LoadEngine(contentPath, svelteFetch, data);
		return {
			...data,
			content: await loadEngine.compute(data.content)
		}
	}

	return data;
}

export const load: PageServerLoad = async (request) => {
	const { params, fetch } = request;
	const { page } = params.page === "" ? { page: "/" } : params;
	console.info('Start loading page data: ', page);

	try {
		
		// throw retrun value of server actions if exists
		runServerActions(request);

		// throw LoadException if load page could not be find
		const data = await getComputedPage(page, fetch);
		console.info('Send page data');
		return data;

	} catch (err) {
		if(err instanceof ServerActionReturnException) {
			console.info('Send server action return');
			return err.data;
		} 
		
		if(err instanceof LoadException) {
			console.warn(err.message);
			throw error(err.getHttpStatusCode());
		}

		console.error(err);
		throw error(500);
	}
};
