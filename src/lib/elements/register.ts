import { CompileException } from "$lib/expections/compile";
import type { ElementData, EmbodiComponent } from "@embodi/types";

const elements: Record<string, EmbodiComponent> = {};


export function registerComponent<T extends ElementData = ElementData>(element: EmbodiComponent<T>, ...names: string[]) {
	names.forEach(name => elements[name.toUpperCase()] = element);
}

export function getComponentFor(name: string): EmbodiComponent {

	const upperCaseName = name.toUpperCase();
	const [, element] = Object.entries(elements).find(([key]) => key === upperCaseName) ?? [];
	if (element == null) {
		throw new CompileException(`Element ${name} seems to be not registered or installed`);
	}
	return element;

}
