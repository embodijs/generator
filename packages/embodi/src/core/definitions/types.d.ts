export type MaybePromise<T> = T | Promise<T>;

export type RenderHookEvent = { data: Record<string, any> };
export type RenderHook = (event: RenderHookEvent) => MaybePromise<unknown>;
