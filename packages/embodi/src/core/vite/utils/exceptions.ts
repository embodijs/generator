export interface CompileException {
	name: 'CompileError';
	id: string;
	message: string;
	frame: string;
	code: string;
	stack: string;
	loc: { line: number; column: number; file: string };
	plugin: string;
	pluginCode: string;
}

export const isCompileException = (exception: any): exception is CompileException => {
	return 'name' in exception && exception.name === 'CompileError';
};
