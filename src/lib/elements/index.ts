import * as group from './group/client';
import { elements as templateElements } from 'embodi-template/components';
import { CompileException } from '$lib/expections/compile';
import type { SvelteComponent } from 'svelte';
import type { EmbodiElement } from '@embodi/types';


const elements: Record<string, EmbodiElement> = {
	group,
	...templateElements
};


export function getClientElement(name: string): EmbodiElement {
	const upperCaseName = name.toUpperCase();
	const [,element] = Object.entries(elements).find(([key,]) => key.toUpperCase() === upperCaseName);
	if (element == null) {
		throw new CompileException(`Element ${name} seems to be not registered or installed`);
	}
	return element;
}

export function getComponentFor(name: string): typeof SvelteComponent | undefined {
	try {
		return getClientElement(name).Component;
	} catch (err) {
		console.error(`Could not load compoennt ${name}`);
		console.error(err);
	}
}
