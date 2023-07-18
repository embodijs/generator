import { getElement} from "$lib/elements/index";
import { createHash } from 'crypto';
import type { ElementData, JsonMap, RenderHelper, imagePath } from '@embodi/types';
import { promises as fs } from 'fs';
import { resolve } from 'node:path';

interface GeneralAssetOptions {
    name?: string;
}

interface ImageAssetOptions extends GeneralAssetOptions {
    format?: 'webp' | 'jpg' | 'jpeg' | 'png',
    width?: number,
    height?: number,
}

export type AssetOptions = ImageAssetOptions | GeneralAssetOptions;

export default class RenderEngine implements RenderHelper {
    constructor (private svelteFetch: typeof fetch, private path: string) {
  
    }

    createEngine (path: string) {
      return new RenderEngine(this.svelteFetch, resolve(this.path, path));
    }
    
    fetch (...args: Parameters<typeof fetch>) {
      return this.svelteFetch(...args);
    }
  
    async load (path: imagePath): Promise<Buffer> 
    async load<T extends JsonMap = JsonMap>(path: string): Promise<T>
    async load (path: string): Promise<unknown> {
      if(path.endsWith('.json')) {
        return JSON.parse(await fs.readFile(resolve(this.path, path), 'utf-8'));
      } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.webp') || path.endsWith('.gif') || path.endsWith('.svg')) {
        return fs.readFile(resolve(this.path, path));
      } else {
        return fs.readFile(resolve(this.path, path), 'utf-8');
      }
    }
    
    private async computeHelper (data: ElementData): Promise<ElementData> {
        const element = getElement(data.type);
        if(element.beforeBuild) {
            console.info(`Running beforeBuild for ${data.type}`);
            return element.beforeBuild(data, this);
        }
        
        return data
    }


    async compute (data: ElementData) : Promise<ElementData>
    async compute (data: ElementData[]) : Promise<ElementData[]>
    async compute (data: ElementData | ElementData[]) {
        
        if(Array.isArray(data)) {
            return Promise.all(data.map(this.computeHelper.bind(this)));
        } else {
            return this.computeHelper(data);
        }
    }

    async storeAsset (content: Buffer, name: string, fileType: string) {
      const queryHash = createHash('sha1').update(JSON.stringify(content)).digest('hex');
      const path = `/files_/${name}-${queryHash}.${fileType}`;
      await fs.writeFile(resolve('./static', `.${path}`), content);
      
      return path;
    }
  }
  