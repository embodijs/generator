import ClientEgine from "$core/elements/ClientEngine";
import type { ClientSetupOptions } from "./types";

export default function clientSetup (init: ClientSetupOptions) {

    const engine = new ClientEgine();

    init.actions.forEach(([ident, action]) => {
        if(action.renderAction) {
            engine.registerAction(action.renderAction, ident);
        }
        if(action.getComponent) {
            engine.registerGetComponentAction(action.getComponent, ident);
        }   
    });

    init.components.forEach(([ident, component]) => {
        engine.registerComponent(component, ident);
    });

    return function client (): ClientEgine {
        

        return engine;
    }
}