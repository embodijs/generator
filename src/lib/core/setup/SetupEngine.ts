import ClientEgine from "$core/elements/ClientEngine";
import type { ElementData, EmbodiComponent, EmbodiElement, SetupHelper } from "$exports";


export default class SetupEngine implements SetupHelper {

    public registerElement(element: EmbodiElement<ElementData, ElementData, ElementData>, ...identifier: string[]): void {
        this.registerComponent(element.component, ...identifier);
    }

    public registerComponent<C extends ElementData>(component: EmbodiComponent<C>, ...identifier: string[]): void {
        ClientEgine.registerComponent(component, ...identifier);
    }
}