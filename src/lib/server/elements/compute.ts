import { getElement} from "$lib/elements/index";
import { createHash } from 'crypto';
import type { ElementData } from '@embodi/types';
import fs from 'fs/promises';
import {join} from 'path';

export interface computeOptions {
  fetch: typeof fetch,
  path: string
}

export const prepareCompute = ({fetch, path}: computeOptions) => async function compute (data: ElementData): Promise<ElementData> {
  const element = getElement(data.type);
  if(element.beforeBuild) {
    return element.beforeBuild(data, {path, compute, storeAsset, fetch, load});
  }

  return data
}

export const storeAsset = async (content: Buffer, name: string, fileType: string): Promise<string> => {
  const queryHash = createHash('sha1').update(JSON.stringify(content)).digest('hex');
  const path = `/file_/${name}-${queryHash}.${fileType}`;
  await fs.writeFile(join('./static', path), content);
  
  return path;
}


