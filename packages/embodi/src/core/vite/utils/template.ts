import * as v from 'valibot';
import { importConfigFile, type EmbodiConfig } from './config.js';
import { join } from 'node:path';

export const ValibotSchema = v.custom<v.ObjectSchema<any, any>>(() => true);

export const LayoutSchema = v.object({
	component: v.string(),
	schema: ValibotSchema
});

export type Layout = v.InferOutput<typeof LayoutSchema>;

export const loadLayouts = async (
	cwd: string = process.cwd(),
	{ inputDirs: { layout } }: EmbodiConfig
): Promise<Record<string, Layout> | undefined> => {
	const fileImport = await importConfigFile('layout.config', join(cwd, layout));

	if (!fileImport.layouts) {
		return;
	}

	const layouts = v.parse(v.record(v.string(), LayoutSchema), fileImport.layouts);

	return layouts;
};

export const getLayoutNames = async (layouts: Layout[]) => {
	return Object.keys(layouts);
};

export const importLayout = async (module: string): Promise<Layout> =>
	(await import(module)).default;
