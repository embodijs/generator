import { CompileException } from "$exceptions/compile";
import type { ClientHelper, ElementData, EmbodiComponent, getComponentAction, renderAction } from "$exports/types";

export default class ClientEgine implements ClientHelper {
        
        protected components: Map<string, EmbodiComponent> = new Map();
        protected chooserActions: Map<string, getComponentAction> = new Map();
        protected actions = new Map<string, renderAction>();

        public registerComponent<C extends ElementData>(component: EmbodiComponent<C>, ...identifier: string[]): void {
            identifier.forEach(id => {
                const upperName = id.toUpperCase();
                this.components.set(upperName, <EmbodiComponent>component);
                
            });
        }

        registerAction(action: renderAction, ...identifier: string[]): void {
            identifier.forEach(id => {
                const upperName = id.toUpperCase();
                this.actions.set(upperName, action);
            });
        }

        registerGetComponentAction(action: getComponentAction, ...identifier: string[]): void {
            identifier.forEach(id => {
                const upperName = id.toUpperCase();
                this.chooserActions.set(upperName, action);
            });
        }

        getComponent<C extends ElementData>(data: ElementData): EmbodiComponent<C> {
            const name = data.type.toUpperCase();
            const action = this.chooserActions.get(name);
            if(typeof action === 'function') {
                return <EmbodiComponent<C>>action(data);
            } else if(this.components.has(name)){
                return <EmbodiComponent<C>>this.components.get(name);
            }
            
            throw new CompileException(`No component ${name} seems to be registered or installed`);
        }

        compute<T extends ElementData = ElementData, U extends ElementData = T>(data: T): U | T {
            const name = data.type.toUpperCase();
            const action = this.actions.get(name);
            if(typeof action === 'function') {
                return <U>action(data, this);
            }

            return data;
        }
}