import SetupEngine from '$core/setup/SetupEngine';
import type { SetupDefinition } from './types';
export type * from './types';

export async function setup (definition: SetupDefinition) {
    const setupEngine = new SetupEngine();
    await Promise.all(definition.elements.map(fu => fu(setupEngine)));
    return setupEngine;
}