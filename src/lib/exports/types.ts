import type { SvelteComponent } from "svelte";

export declare type JsonMap = {
	[key: string]: AnyJson | undefined | unknown;
};

export declare type JsonArray = Array<AnyJson>;

export type AnyJson = string | boolean | number | JsonMap | JsonArray;

export type imagePath = `${string}.png` | `${string}.jpg` | `${string}.webp` | `${string}.gif` | `${string}.svg`;
export type jsonFile = `${string}.json`;

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

export interface RenderHelper {
	compute (data: ElementData) : Promise<ElementData>
	compute (data: ElementData[]) : Promise<ElementData[]>
	load(path: imagePath): Promise<Buffer>
	load<T extends JsonMap = JsonMap>(path: jsonFile): Promise<T>
	load(path: string): Promise<unknown>
	createEngine(path: string): RenderHelper
	copyAsset (path: string, folder: string): Promise<string>
	storeAsset (content: Buffer, name: string, fileType: string): Promise<string>
}

export interface beforeBuildFunc <T extends ElementData = ElementData, U extends ElementData = ElementData> {
	(data: T, helper: RenderHelper): Promise<U>,
}

export interface beforeAllFunc {
	(helper: RenderHelper): Promise<void>,
}

export interface EmbodiComponentProps<T = ElementData> {
	data: T;
}

export type EmbodiComponent<T = ElementData> = typeof SvelteComponent<EmbodiComponentProps<T>>

export interface EmbodiBuildFunction<F extends ElementData = ElementData, C extends ElementData = ElementData>  {
	beforeBuild?: beforeBuildFunc<F, C>
	beforeAll?: beforeAllFunc
}

export interface EmbodiElement
	<F extends ElementData = ElementData, C extends ElementData = ElementData>  
	extends EmbodiBuildFunction<F, C> 
{
	svelte?: EmbodiComponent<C>
}

