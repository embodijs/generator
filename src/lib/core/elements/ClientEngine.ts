import { CompileException } from "$exceptions/compile";
import type { ClientHelper, ElementData, EmbodiComponent, renderAction } from "$exports/types";

export default class ClientEgine implements ClientHelper {
        
        protected static components: Map<string, EmbodiComponent> = new Map();
        protected static beforeRenderActions = new Map<string, renderAction>()
    
    
        public static registerComponent<C extends ElementData>(component: EmbodiComponent<C>, ...identifier: string[]): void {
            identifier.forEach(id => {
                const upperName = id.toUpperCase();
                ClientEgine.components.set(upperName, <EmbodiComponent>component);
                
            });
        }

        static registerAction(action: renderAction, ...identifier: string[]): void {
            identifier.forEach(id => {
                const upperName = id.toUpperCase();
                ClientEgine.beforeRenderActions.set(upperName, action);
            });
        }

        getComponent<C extends ElementData>(id: string): EmbodiComponent<C> {
            const name = id.toUpperCase();
            
            if(ClientEgine.components.has(name)){
                return <EmbodiComponent<C>>ClientEgine.components.get(name);
            }
            
            throw new CompileException(`No component ${name} seems to be not registered or installed`);
        }
}