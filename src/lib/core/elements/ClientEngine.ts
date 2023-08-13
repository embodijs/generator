import { CompileException } from "$exceptions/compile";
import type { ClientHelper, ElementData, EmbodiComponent } from "$exports";

export default class ClientEgine implements ClientHelper {
        
        protected static components: Map<string, EmbodiComponent> = new Map();
    
    
        public static registerComponent<C extends ElementData>(component: EmbodiComponent<C>, ...identifier: string[]): void {
            identifier.forEach(id => {
                const upperName = id.toUpperCase();
                ClientEgine.components.set(upperName, <EmbodiComponent>component);
                
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