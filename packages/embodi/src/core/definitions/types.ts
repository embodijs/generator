import type { GenericSchema, GenericSchemaAsync } from 'valibot';
import type { FileManager } from '../vite/utils/FileManager.js';

import type { Component } from 'svelte';

export type MaybePromise<T> = T | Promise<T>;
export type AnyObject = Record<string | number | symbol, any>;
export type RenderHookEvent = { data: Record<string, any> };
export type RenderHook = (event: RenderHookEvent) => MaybePromise<unknown>;

export type LoadEvent = {
	data: Record<string, any>;
	url: URL;
};

export type LayoutEvent = LoadEvent & {
	html: string | null;
	helper: {
		fileManager: FileManager;
		resolvePath: (path: string) => string;
	};
};

export type DataSchema = GenericSchema<AnyObject> | GenericSchemaAsync<AnyObject>;

export type EnrichActionReturn = { html: string; data: AnyObject };

export type LoadAction = (event: LoadEvent) => Record<string, any>;
export type EnrichAction = (event: LayoutEvent) => MaybePromise<EnrichActionReturn>;

type PageElements = {
	Component?: Component;
	html?: string;
	Layout?: Component;
	data: Record<string, any>;
};

export type PageData = PageElements & {
	load?: LoadAction;
	layoutActions: { schema?: DataSchema; enrich?: EnrichAction };
};

export type PageImportFunction = () => Promise<{ default: PageData }>;
