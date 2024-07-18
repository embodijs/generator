import { FilesystemAdapter } from "@loom-io/node-filesystem-adapter";
import { createCombinedConverter, type FileConverter } from "@loom-io/converter";
import { createJsonConverter } from "@loom-io/json-converter";
import { createYamlConverter } from "@loom-io/yaml-converter";
import { createFrontMatterConverter } from '@loom-io/front-matter-converter';


export const adapter = new FilesystemAdapter();
//TODO: This should be solved in Font-Matter Converter
export const frontMatterConverter: ReturnType<typeof createFrontMatterConverter> = createFrontMatterConverter();
export const converter = createCombinedConverter([createJsonConverter(), createYamlConverter()]);
