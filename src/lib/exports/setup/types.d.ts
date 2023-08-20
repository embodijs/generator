import type { ClientActions, EmbodiComponent, ServerActions } from "$exports/types";

export interface ServerSetupOptions {
    actions: [string, ServerActions][];
}

export interface ClientSetupOptions {
    actions: [string, ClientActions][];
    components: [string, EmbodiComponent][];
}