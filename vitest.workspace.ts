import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      include: ['packages/embodi/**/*.spec.ts'],
      name: 'packages',
      environment: 'node'
    }
  }
]);
