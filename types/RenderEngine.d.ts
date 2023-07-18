/// <reference types="node" />
import type { ElementData } from '@embodi/types';
interface GeneralAssetOptions {
    name?: string;
}
interface ImageAssetOptions extends GeneralAssetOptions {
    format?: 'webp' | 'jpg' | 'jpeg' | 'png';
    width?: number;
    height?: number;
}
export type AssetOptions = ImageAssetOptions | GeneralAssetOptions;
export default class RenderEngine {
    private svelteFetch;
    private path;
    constructor(svelteFetch: typeof fetch, path: string);
    createEngine(path: string): RenderEngine;
    fetch(...args: Parameters<typeof fetch>): Promise<Response>;
    load(path: string): Promise<any>;
    private computeHelper;
    compute(data: ElementData): Promise<ElementData>;
    compute(data: ElementData[]): Promise<ElementData[]>;
    storeAsset(content: Buffer, name: string, fileType: string): Promise<string>;
}
export {};
