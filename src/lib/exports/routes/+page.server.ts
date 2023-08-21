import type { PageServerLoad } from '../../../routes/[...slug]/$types';
import server from '$__embodi/server/setup';

export const load: PageServerLoad = async (request) => {
	// TODO: change params page to slug
	return server(request);
};
