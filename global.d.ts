import type { PageFile } from "./src/lib/exports/types";
import type { serverSetup, clientSetup } from "./src/lib/exports/setup";

declare module "$__embodi/data" {
    export const pages: PageFile[];
    export const contentPath: string;
    export const pagePath: string;
}

declare module "$__embodi/server/setup" {
    type serverSetup = ReturnType<typeof serverSetup>;
    export default serverSetup;
}

declare module "$__embodi/client/setup" {
    type clientSetup = ReturnType<typeof clientSetup>;
    export default clientSetup;
}