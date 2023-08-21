import {  error, type ServerLoadEvent } from "@sveltejs/kit"
import type { PageFile, ServerHelper, serverAction } from "$exports/types"
import { LoadException } from "$exceptions/load"
import type { ServerSetupOptions } from "./types";
import LoadEngine from "$core/elements/LoadEngine.server";
import ServerEngine from "$core/elements/ServerEngine.server";

import { contentPath, pages } from '$__embodi/data';


const defaultServer: serverAction = async (slug, url, helper: ServerHelper): Promise<PageFile> => {
      
    try {

    console.info('Start loading page data: ', slug);

    const data = await helper.compute(slug);
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
}


export default function serverSetup (init: ServerSetupOptions) {

    const serverActions = init.actions.reduce<serverAction[]>((acc, [ident, action]) => {
        if(action.loadAction) {
            LoadEngine.registerAction(action.loadAction, ident);
        }
        if(action.serverAction) {
            acc.push(action.serverAction);
        }

        return acc;
    }, []);
    
    return function server (event: ServerLoadEvent<{slug: string}, object, '/[...slug]'>): Promise<PageFile> | PageFile {
        
        const { params, url } = event;
        const { slug } = params.slug === "" ? { slug: "/" } : params;

        const engine = new ServerEngine(contentPath, pages, event);
        for(const action of serverActions) {
            const ret = action(slug, url, engine);
            if(ret != null) {
                return ret;
            }
        }

        return defaultServer(slug, url, engine);
    }
}

