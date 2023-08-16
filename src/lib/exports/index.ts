import ClientEgine from '$core/elements/ClientEngine';
import SetupEngine from '$core/setup/SetupEngine';
import type { SetupDefinition } from './types';
export type * from './types';



export async function setup (definition: SetupDefinition) {
    const setupEngine = new SetupEngine();
    await Promise.all(definition.elements.map(fu => fu(setupEngine)));
    const client = new ClientEgine();
    console.log(client.getComponent('GROUP'));
    return setupEngine;
}