import * as group from './group';
import * as ref from './ref';
import { elements as templateElements } from 'embodi-template';
import { CompileException } from '$lib/expections/compile';
import type { SvelteComponent } from 'svelte';
import type { EmbodiElement } from '@embodi/types';

export const elements = <EmbodiElement[]>[group, ref, ...templateElements];

export function getElement(name: string): EmbodiElement {
	const element = elements.find((el) => el.identifier === name);
	if (element == null) {
		throw new CompileException(`Element ${name} seems to be not registered or installed`);
	}
	return element;
}

export function getComponentFor(name: string): typeof SvelteComponent | undefined {
	try {
		return getElement(name).Component;
	} catch (err) {
		console.error(`Could not load compoennt ${name}`);
		console.error(err);
	}
}
