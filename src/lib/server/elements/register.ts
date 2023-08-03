import type { EmbodiBuildFunction, RenderHelper } from '@embodi/types';
import { ElementNotFoundException } from '$lib/expections/template';
import { CompileException } from '$lib/expections/compile';

const elements: Record<string, EmbodiBuildFunction> = {};
let pageFolder: string;
let fileFolder: string;

export function registerBuildFunction(name: string, element: EmbodiBuildFunction) {
	elements[name.toUpperCase()] = element;
}

export function setPageFolder(path: string) {
	pageFolder = path;
}

export function getPageFolder() {
	if(pageFolder == null) throw new CompileException('Page folder not set');
	return pageFolder;
}

export function setFileFolder(path: string) {
	fileFolder = path;
}

export function getFileFolder() {
	if(fileFolder == null) throw new CompileException('File folder not set'); 
	return fileFolder;
}

export function runBeforeAll(helper: RenderHelper) {
	const promises = Object.values(elements).map((element) => {
		if (element.beforeAll == null) return Promise.resolve();
		return element.beforeAll(helper);
	});
	return Promise.all(promises);
}

export function getBuildFuntion(name: string): EmbodiBuildFunction {
	const upperCaseName = name.toUpperCase();
	const [, element] =
		Object.entries(elements).find(([key]) => key === upperCaseName) ?? [];
	if (element == null) {
		throw new ElementNotFoundException(name);
	}
	return element;
}

