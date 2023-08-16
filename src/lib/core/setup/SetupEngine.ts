import ClientEgine from "$core/elements/ClientEngine";
import LoadEngine from "$core/elements/LoadEngine.server";
import ServerEngine from "$core/elements/ServerEngine.server";
import type { ElementData, EmbodiComponent, EmbodiElement, SetupHelper, loadAction, renderAction, serverAction } from "$exports";


export default class SetupEngine implements SetupHelper {

    public registerElement(element: EmbodiElement<ElementData, ElementData, ElementData>, ...identifier: string[]): void {
        this.registerComponent(element.component, ...identifier);
    }

    public registerComponent<C extends ElementData>(component: EmbodiComponent<C>, ...identifier: string[]): void {
        ClientEgine.registerComponent(component, ...identifier);
    }

    registerServerAction<T>(func: serverAction<T>): void {
        ServerEngine.registerAction(<serverAction>func);
    }
	registerLoadAction<T extends ElementData, U extends ElementData = T>(func: loadAction<T, U>, ...identifier: string[]) {
        LoadEngine.registerAction(<loadAction><unknown>func, ...identifier);
    }
	registerRendeAction<T extends ElementData, U extends ElementData = T>(func: renderAction<T, U>, ...identifier: string[]): void {
        ClientEgine.registerAction(<renderAction><unknown>func, ...identifier);
    }
}