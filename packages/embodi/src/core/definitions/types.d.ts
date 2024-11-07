export type MaybePromise<T> = T | Promise<T>;
export type AnyObject = Record<string | number | Symbol, any>;
export type RenderHookEvent = { data: Record<string, any> };
export type RenderHook = (event: RenderHookEvent) => MaybePromise<unknown>;

export type LoadEvent = {
	data: Record<string, any>;
};
export type LoadAction = (event: LoadEvent) => Record<string, any>;

export type PageImportFunction = () => Promise<{
	Component?: ConstructorOfATypedSvelteComponent;
	html?: string;
	Layout?: ConstructorOfATypedSvelteComponent;
	data: Record<string, any>;
	load?: LoadAction;
}>;
