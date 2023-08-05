import type { EmbodiElement } from "$exports/types";


export interface EmbodiViteElement extends EmbodiElement {
    identifier: string | string[];
}

export interface ViteEmbodiConfig {
    elements: EmbodiViteElement[];
    pages: string;
    content: string;
}