export const generateInternalStores = () => `
  import { writable } from 'svelte/store';
  export const page = writable({ url: null});
`;

export const generateReadableStores = (internalRef: string) => `
  import * as internal from '${internalRef}';
  export const page = {
    subscribe: internal.page.subscribe,
  }
  `;
