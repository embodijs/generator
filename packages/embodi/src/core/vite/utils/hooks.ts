import { resolve } from 'node:path';
import { adapter } from './project-adapter.js';

const defaultCode = `
  export const renderHook = function () {}
`;

const generateCode = async (cwd: string) =>
	`import * as hooks from '${resolve(cwd, 'hooks')}';
function empty() {}
export const renderHook = hooks.render ?? empty;`;

const t = () => {};

const hasHooksFile = async () => {
	return (await adapter.file('hooks.ts').exists()) || (await adapter.file('hooks.js').exists());
};

export const generateHooksCode = async (cwd = process.cwd()) => {
	if (!(await hasHooksFile())) {
		return defaultCode;
	}
	return generateCode(cwd);
};
