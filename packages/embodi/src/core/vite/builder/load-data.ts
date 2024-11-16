import type { Directory } from "@loom-io/core";
import { adapter, converter } from "./project-adapter.js";



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
	// TODO: handle not exist exception
	if(await dataDir.exists()) {
		return loadDataFromLoomDir(dataDir);
	} else {
		return {};
	}
}

export async function loadAppHtml(statics: string) {
	const staticDir = adapter.dir(statics);
	const file = staticDir.file("app.html");
	return file.text();
}