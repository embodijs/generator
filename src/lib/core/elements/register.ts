import { CompileException } from "$exceptions/compile.js";
import { ElementNotFoundException } from '$exceptions/template.js';

import type { ElementData, EmbodiComponent, EmbodiElement, EmbodiBuildFunction, RenderHelper } from "$exports/types";
import type { HandledPageFile, PageFile } from "@embodi/types";
import { PageLoadException } from "$exceptions/load.js";

let pageFolder: string;
let contentFolder: string;
const elements: Record<string, EmbodiElement> = {};
const pages: HandledPageFile[] = [];

export function registerElement<F extends ElementData = ElementData, C extends ElementData = ElementData>(element: EmbodiElement<F, C>, ...names: string[]) {
	names.forEach(name => {
		const upperName = name.toUpperCase();
		elements[upperName] = (element as unknown as EmbodiElement);
	});
}

const addToElementHelper = <T extends ElementData = ElementData>(element: EmbodiElement<T>) => (name: string) => {
	const upperName = name.toUpperCase();
	elements[upperName] = <EmbodiElement>{
		...elements[upperName],
		...element
	}
}

export function registerComponent<T extends ElementData = ElementData>(component: EmbodiComponent<T>, ...names: string[]) {
	names.forEach(addToElementHelper({ svelte: component }));
}

export function getComponentFor(name: string): EmbodiComponent {

	const upperCaseName = name.toUpperCase();
	const [, element] = Object.entries(elements).find(([key]) => key === upperCaseName) ?? [];
	if (element?.svelte == null) {
		throw new CompileException(`No component ${name} seems to be not registered or installed`);
	}
	return element.svelte;

}

export function registerBuildFunction<F extends ElementData = ElementData, C extends ElementData = ElementData>(element: EmbodiBuildFunction<F, C>, ...names: string[]) {
	names.forEach(addToElementHelper(element));
}

export class PageStorage {

	static instance: PageStorage;
	protected pages: HandledPageFile[] = [];

	static getInstance() {
		if (PageStorage.instance == null) {
			PageStorage.instance = new PageStorage();
		}
		return PageStorage.instance;
	}

	addPage(page: HandledPageFile) {
		this.pages.push(page);
	}

	async getPage(slug: string): Promise<PageFile> {
		const page = this.pages.find(page => page.slug === slug);
		if (page == null) throw new PageLoadException(404, `No page with slug ${slug} found`);
		return {
			...page,
			content: await page.content
		};
	}
}


export function registerPage (page: HandledPageFile) {
	pages.push(page);
}

export async function getPages(): Promise<PageFile[]> {
	return await Promise.all(pages.map(async ({content, ...meta}) => {
		return {
			...meta,
			content: await content
		}
	}))
}

export async function getPage(slug: string): Promise<PageFile> {
	const page = pages.find(page => page.slug === slug);
	if(page == null) throw new PageLoadException(404 , `No page with slug ${slug} found`);
	return {
		...page,
		content: await page.content
	};
} 

export function setPageFolder(path: string) {
	pageFolder = path;
}

export function getPageFolder() {
	if(pageFolder == null) throw new CompileException('Page folder not set');
	return pageFolder;
}

export function setContentFolder(path: string) {
	contentFolder = path;
}

export function getContentFolder() {
	if(contentFolder == null) throw new CompileException('Content folder not set'); 
	return contentFolder;
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