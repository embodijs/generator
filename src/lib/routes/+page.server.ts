import { error } from '@sveltejs/kit';
import type { PageServerLoad } from '../../routes/[...page]/$types';
import { LoadException, PageLoadException } from '$exceptions/load.js';

import { pages } from '$_embodi/data';
import setup from '$_embodi/setup';
setup();

export const load: PageServerLoad = async ({ params }) => {
	const { page } = params.page === "" ? { page: "/" } : params;
	console.info('Start loading page data: ', page);
	
	try {
		const data = pages.find(({slug}) => slug === page);
		if(data == null) throw new PageLoadException(404 , `No page with slug ${slug} found`);
		console.info('Send page data');
		return data;

	} catch (err) {
		if(err instanceof LoadException) {
			console.warn(err.message);
			throw error(err.getHttpStatusCode());
		}

		console.error(err);
		throw error(500);
	}
};
