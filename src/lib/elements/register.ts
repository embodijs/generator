import { CompileException } from "$lib/expections/compile";
import type { EmbodiComponent } from "@embodi/types";
import type { SvelteComponent } from "svelte";

const elements: Record<string, EmbodiComponent> = {};

export function registerComponent(name: string, element: EmbodiComponent) {
	elements[name] = element;
}

export function getClientElement(name: string): EmbodiComponent {
	const upperCaseName = name.toUpperCase();
	const [, element] = Object.entries(elements).find(([key]) => key.toUpperCase() === upperCaseName) ?? [];
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
