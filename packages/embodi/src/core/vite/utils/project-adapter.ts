import { FilesystemAdapter } from "@loom-io/node-filesystem-adapter";
import { createCombinedConverter } from "@loom-io/converter";
import { createJsonConverter } from "@loom-io/json-converter";
import { createYamlConverter } from "@loom-io/yaml-converter";

export const adapter = new FilesystemAdapter();
export const converter = createCombinedConverter([createJsonConverter(), createYamlConverter()]);
