import * as group from '$lib/elements/group/server';
import * as ref from '$lib/elements/ref/server';
import { elements as templateElements } from 'embodi-template/build';
import type { EmbodiElement } from '@embodi/types';
import { ElementNotFoundException } from '$lib/expections/template';


const elements: Record<string, EmbodiElement> = {
	group,
    ref,
	...templateElements
};


export function getBuildData(name: string): EmbodiElement {
	const upperCaseName = name.toUpperCase();
	const [,element] = Object.entries(elements).find(([key,]) => key.toUpperCase() === upperCaseName) ?? [];
	if (element == null) {
		throw new ElementNotFoundException(name);
	}
	return element;
}
