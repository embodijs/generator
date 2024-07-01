import { FilesystemAdapter } from "@loom-io/node-filesystem-adapter";
import { createCombinedConverter } from "@loom-io/converter";
import { createJsonConverter } from "@loom-io/json-converter";
import { createYamlConverter } from "@loom-io/yaml-converter";
import type { Directory } from "@loom-io/core";

const adapter = new FilesystemAdapter();
const converter = createCombinedConverter([createJsonConverter(), createYamlConverter()]);

export function addToObjectRecursively(path: string[], object: Record<string, unknown>, value: unknown) {
	if (path.length === 1) {
		object[path[0]] = value;
		return;
	}
	const key = path.shift()!;
	if (!object[key]) {
		object[key] = {};
	}
	addToObjectRecursively(path, object[key] as Record<string, unknown>, value);
}

export async function loadDataFromLoomDir(source: Directory) {
	const allFiles = await source.files(true);
	return allFiles.asArray().reduce(async (acc, file) => {
		acc = await acc;
		const data = await converter.parse(file);
		const path = source.relativePath(file)!;
		const parts = path.split("/").slice(0, -1);
		parts.push(file.getNameWithoutExtension());
		addToObjectRecursively(parts, acc, data);
		return acc;
	}, {})

}

export async function loadData(source: string) {
	const dataDir = adapter.dir(source);
	console.log(dataDir.path);
	console.log(await dataDir.exists());
	// TODO: handle not exist exception
	if(await dataDir.exists()) {
		return loadDataFromLoomDir(dataDir);
	} else {
		return {};
	}
}