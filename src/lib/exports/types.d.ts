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

export interface ServerHelper {
	load(path: imagePath): Promise<Buffer>
	load<T extends JsonMap = JsonMap>(path: jsonFile): Promise<T>
	load(path: string): Promise<unknown>
	compute(slug: string): Promise<PageFile>
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
	getComponent<C extends ElementData>(data: C): EmbodiComponent<C>
}

export interface serverAction {
	(slug: string, url: URL, helper: ServerHelper): Promise<PageFile> | PageFile
}

export interface loadAction<T extends ElementData = ElementData, U extends ElementData = T> {
	(data: T, helper: LoadHelperHelper): Promise<U> | U
}

export interface renderAction<T extends ElementData = ElementData, U extends ElementData = T> {
	(data: T, helper: ClientHelper): U
}

export interface getComponentAction<T extends ElementData = ElementData> {
	(data: T): EmbodiComponent<T>
}

export interface ClientActions {
	getComponent: getComponentAction;
	renderAction: renderAction;
} 

export interface ServerActions {
	loadAction: loadAction;
	serverAction: serverAction;
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
	storeAsset (content: Buffer, name: string, fileType: string): Promise<string>
}

export interface BuildSetupHelper extends BuildHelperBase {
	registerAction<T extends ElementData, U extends ElementData>(action: buildAction<T,U>, ...identifiers: string[]): void
	resolveComponent(path: string, ...identifiers: string[]): Promise<void>
	resolveServerActions(path: string, ...identifiers: string[]): Promise<void>
	resolveClientActions(path: string, ...identifiers: string[]): Promise<void>
}

export interface BuildHelper extends BuildHelperBase {
	compute (data: ElementData) : Promise<ElementData>
	compute (data: ElementData[]) : Promise<ElementData[]>
	createEngine(path: string): BuildHelper
}

export interface beforeAllFunc {
	(helper: BuildSetupHelper): Promise<void>,
}