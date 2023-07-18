import type { ElementData } from '@embodi/types';


export interface GroupElementData extends ElementData {
  id: string;
  width: 'full' | 'default';
  element: string;
  class: string;
  design: 'custom' | 'default';
  content: ElementData[];
  extendable: string[];
}