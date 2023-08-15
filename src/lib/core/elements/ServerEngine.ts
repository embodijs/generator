import type { ServerHelper, serverAction } from "$exports/types";
import type { RequestEvent } from "@sveltejs/kit";
import { AbstractBaseEngine } from "./AbstractBaseEngine";


export default class ServerEngine extends AbstractBaseEngine implements ServerHelper{

	protected static actions = new Set<serverAction>();

    constructor(
        protected path: string,
        protected svelteRequestEvent: Pick<RequestEvent<{page: string}, null>, 'setHeaders' | 'fetch' | 'params' | 'url'>
    ) {
		super(path);
	}

	static registerAction(action: serverAction) {
		ServerEngine.actions.add(action);
	}

	static hasActions(): boolean {
		return ServerEngine.actions.size !== 0;
	}

	async compute(): Promise<unknown> {
		if(ServerEngine.actions.size === 0) {
			return;
		}

		const iter = ServerEngine.actions.values();
		const {params, url} = this.svelteRequestEvent
		
		let done: boolean | undefined;
		let value: serverAction;
		do {
			({value, done} = iter.next());
			const ret = await value(params.page, url, this);
			if(ret != null) return ret;
		} while (done !== true);
	}

	setHeaders(headers: Record<string, string>): void {
		this.svelteRequestEvent.setHeaders(headers);
	}

	fetch(path: string, init?: RequestInit): Promise<Response> {
		return this.svelteRequestEvent.fetch(path, init);
	}


}