import type {
	BaseIssue,
	BaseSchema,
	ObjectSchema,
	ObjectSchemaAsync,
	TransformAction
} from 'valibot';
import { importConfigFile, type EmbodiConfig } from './config.js';
import { join } from 'node:path';

export type Layout = {
	component: string;
	schema: (validate: {
		v: typeof import('valibot');
		e: {
			image: () => TransformAction<string, [number, string][]>;
		};
	}) => ObjectSchema<any, any> | ObjectSchemaAsync<any, any>;
};

export type DataSchema = BaseSchema<
	Record<string, unknown>,
	Record<string, unknown>,
	BaseIssue<unknown>
>;

export const prepareComponentLoad = async (
	cwd: string = process.cwd(),
	{ inputDirs: { layout } }: EmbodiConfig
) => {
	const fileImport = await importConfigFile('layout.config', join(cwd, layout));

	return (component: string): string | undefined => {
		if (!fileImport.layouts) {
			return;
		}

		return fileImport.layouts[component].component;
	};
};
export const getLayoutNames = async (layouts: Layout[]) => {
	return Object.keys(layouts);
};

export const importLayout = async (module: string): Promise<Layout> =>
	(await import(module)).default;
