import type { ElementData, jsonFile } from "@embodi/types";

export interface RefElementData extends ElementData {
    type: "Ref",
    name: string,
    path: jsonFile
}
