import type { PageFile, ServerHelper, serverAction } from "$exports/types";
import type { RequestEvent } from "@sveltejs/kit";
import { AbstractBaseEngine } from "./AbstractBaseEngine.server";
import LoadEngine from "./LoadEngine.server";

export default class ServerEngine extends AbstractBaseEngine implements ServerHelper{

    constructor(
        protected path: string,
		protected pages: PageFile[],
        protected svelteRequestEvent: Pick<RequestEvent<{slug: string}, null>, 'setHeaders' | 'fetch' | 'params' | 'url'>
    ) {
		super(path);
	}

	async getPageBySlug (slug: string) {
		const data = this.pages.find(({slug: s}) => s === slug);
		
		if(data == null){ 
			throw new Error(`No page with slug ${slug} found`);
		}

		return data;
	}

	/**
	 * Laod page and execute load actions if exists
	 * 
	 * @param slug - Slug of the page to load
	 * @returns {Promise<PageFile>} - Computed page data
	 */
	async compute(slug: string): Promise<PageFile> {
		const data = await this.getPageBySlug(slug);
		if(LoadEngine.hasActions()) {
			const loadEngine = new LoadEngine(this.path, this.svelteRequestEvent.fetch, data);
			return {
				...data,
				content: await loadEngine.compute(data.content)
			}
		}

		return data;
	}

	setHeaders(headers: Record<string, string>): void {
		this.svelteRequestEvent.setHeaders(headers);
	}

	fetch(path: string, init?: RequestInit): Promise<Response> {
		return this.svelteRequestEvent.fetch(path, init);
	}


}