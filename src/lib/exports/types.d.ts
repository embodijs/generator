import type { SvelteComponent } from "svelte";

/************
 * 
 * Basic Types
 * 
 */

export declare type JsonMap = {
	[key: string]: AnyJson | undefined | unknown;
};

export declare type JsonArray = Array<AnyJson>;

export type AnyJson = string | boolean | number | JsonMap | JsonArray;

export type imagePath = `${string}.png` | `${string}.jpg` | `${string}.webp` | `${string}.gif` | `${string}.svg`;
export type jsonFile = `${string}.json`;


/**********
 * 	
 * 	
 * 	Embodi Types
 * 	
 * 
 */

interface PageFileBase<T> extends JsonMap {
	type: 'Page',
	title: string,
	slug: string,
	lang: string,
	description?: string,
	author?: string,
	content: T;
}

export interface PageFile extends PageFileBase<ElementData[]> {}

export interface HandledPageFile extends PageFileBase<Promise<ElementData[]>> {}

export interface ComponentFile extends JsonMap {
	type: 'Component',
	name: string,
	description?: string,
	author?: string,
	content: ElementData;
}

export interface ElementData extends JsonMap{
	type: string;
	id?: string;
	template?: string;
	[x: string]: unknown;
}



/**********
 * 
 * 
 * Render and Setup Definitions
 * 
 * 
 */

export interface EmbodiComponentProps<T = ElementData> {
	data: T;
	engine?: ClientHelper;
}

export type EmbodiComponent<T = ElementData> = typeof SvelteComponent<EmbodiComponentProps<T>>


export interface EmbodiElement
	<F extends ElementData = ElementData, B = F,  C = B>  
{
	identifier: string[];
	loadAction?: (data: F) => Promise<B>
	renderAction?: (data: B) => Promise<C>
	component: EmbodiComponent<C>
}

export interface ServerHelper {
	load(path: imagePath): Promise<Buffer>
	load<T extends JsonMap = JsonMap>(path: jsonFile): Promise<T>
	load(path: string): Promise<unknown>
	setHeaders(headers: Record<string, string>): void
	fetch(path: string, init?: RequestInit): Promise<Response>
}

export interface LoadHelper {
	createEngine(path: string): LoadHelper
	load(path: imagePath): Promise<Buffer>
	load<T extends JsonMap = JsonMap>(path: jsonFile): Promise<T>
	load(path: string): Promise<unknown>
	compute(data: ElementData[]): Promise<ElementData[]>
	compute(data: ElementData): Promise<ElementData>
	fetch(path: string, init?: RequestInit): Promise<Response>
	getRawContent(): ElementData[]
	getMeta(): Omit<PageFile, 'content'>
}
	

export interface ClientHelper {
	getComponent<C extends ElementData>(id: string): EmbodiComponent<C>
}

export interface serverAction<T = void> {
	(slug: string, url: URL, helper: ServerHelper): Promise<T> | T
}

export interface loadAction<T extends ElementData = ElementData, U extends ElementData = T> {
	(data: T, helper: LoadHelperHelper): Promise<U> | U
}

export interface renderAction<T extends ElementData = ElementData, U extends ElementData = T> {
	(data: T, helper: ClientHelper): Promise<U> | U
}

export interface SetupHelper { 
	registerElement(element: EmbodiElement, ...identifier: string[]): void
	registerComponent<C extends ElementData>(component: EmbodiComponent<C>, ...identifier: string[]): void
	registerServerAction<T>(func: serverAction<T>): void
	registerLoadAction<T extends ElementData, U extends ElementData = T>(func: loadAction<T, U>, ...identifier: string[]): void
	registerRendeAction<T extends ElementData, U extends ElementData = T>(func: renderAction<T, U>, ...identifier: string[]): void
}

export interface PluginSetupFunc {
	(helper: SetupHelper): Promise<void> | void,
}

export interface SetupDefinition {
	elements: PluginSetupFunc[],
}



/*******
 * 
 * 
 * Build Definitions
 * 
 * 
 */

export interface buildAction <T extends ElementData = ElementData, U extends ElementData = T> {
	(data: T, helper: BuildHelper): Promise<U>,
}


export interface BuildHelperBase {
	load(path: imagePath): Promise<Buffer>
	load<T extends JsonMap = JsonMap>(path: jsonFile): Promise<T>
	load(path: string): Promise<unknown>
	copyAsset (path: string, folder: string): Promise<string>
	storeAsset (content: Buffer, name: string, fileType: string): Promise<string>
}

export interface BuildSetupHelper extends BuildHelperBase {
	registerAction<T extends ElementData, U extends ElementData>(action: buildAction<T,U>, ...identifiers: string[]): void
	includeElement(path: string, ...indetifiers: string[]): void
}

export interface BuildHelper extends BuildHelperBase {
	compute (data: ElementData) : Promise<ElementData>
	compute (data: ElementData[]) : Promise<ElementData[]>
	createEngine(path: string): BuildHelper
}

export interface beforeAllFunc {
	(helper: BuildSetupHelper): Promise<void>,
}