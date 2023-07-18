import type { ElementData, RenderHelper, beforeBuildFunc } from "@embodi/types";

import Component from './component.svelte';
import type { GroupElementData } from "./types";


export const identifier = 'Group';

export {Component};


export interface dataType extends ElementData {
  content: ElementData[]
}

export const beforeBuild: beforeBuildFunc<GroupElementData> = async (data: GroupElementData, helper: RenderHelper): Promise<ElementData> => {

  return {
    ...data,
    content: await helper.compute(data.content)
  }
}