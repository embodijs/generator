
import type { PageFile, ComponentFile, ElementData } from './src/lib/exports/types'

declare module '$__embodi/data' {
    export const pages: PageFile[];
    export const components: ComponentFile[];
    export const elements: ElementData[];
}

declare module '$__embodi/setup' {
    export default function setup(): void;
}