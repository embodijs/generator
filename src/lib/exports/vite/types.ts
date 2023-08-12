import type { beforeAllFunc } from "$exports/types";

export interface EmbodiBuildConfig {
    elements: beforeAllFunc[];
    pagesPath: string;
    contentPath: string;
}
