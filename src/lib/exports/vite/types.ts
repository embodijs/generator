import type { beforeAllFunc } from "$exports/types";
import '$lib/exports/vite/modules';

export interface EmbodiBuildConfig {
    elements: beforeAllFunc[];
    pagesPath: string;
    contentPath: string;
}

