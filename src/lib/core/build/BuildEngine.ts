import type { BuildHelper, BuildSetupHelper, ElementData, buildAction } from '$exports/types';
import { promises as fs } from 'node:fs';
import { resolve, basename } from 'node:path';
import { createHash } from 'node:crypto';
import type { VitePluginContext } from './contextHandlers.js';
import { AbstractBaseEngine } from '$core/elements/AbstractBaseEngine.server.js';
import { CompileException } from '$exceptions/compile.js';

export default class BuildEngine extends AbstractBaseEngine implements BuildHelper, BuildSetupHelper {

	protected path: string;
	protected viteContext: VitePluginContext;
	protected static actions: Map<string, buildAction> = new Map();
	protected static elementPaths: Map<string, string> = new Map();
	protected static componentPaths = new Set<string>();
	static readonly importer: string = 'EmbodiBuildEngine';

	protected static modulePaths = new Set<string>('EmbodiBuildEngine');

	constructor(
		path: string,
		context: VitePluginContext,
	) {
		super(path);
		this.path = resolve(path);
		this.viteContext = context;
	}

	getPath() {
		return this.path;
	}

	createEngine(path: string) {
		const engine = new BuildEngine(resolve(this.path, path), this.viteContext);
		return engine;
	}

	registerAction<T extends ElementData, U extends ElementData = T>(action: buildAction<T, U>, ...identifiers: string[]): void {
		identifiers.forEach((identifier) => {
			//TODO: think about type conversion and remove unknwon
			BuildEngine.actions.set(identifier.toUpperCase(), <buildAction>(action as unknown));
		});
	}

	protected async resolveElement(_path: string): Promise<string> {
		const path = resolve(_path);
		const resolveId = await this.viteContext.resolve(path, BuildEngine.importer, { isEntry: true, })
		if(resolveId == null) {
			throw new CompileException(`Could not resolve path ${path}`)
		}
		this.viteContext.load({
			id: resolveId.id,
			resolveDependencies: true
		});
		return path;
	}

	async includeElement(_path: string, ...indetifiers: string[]): Promise<void> {
		const path = await this.resolveElement(_path);
		indetifiers.forEach((identifier) => {
			BuildEngine.elementPaths.set(identifier.toUpperCase(), path);
		});
	}

	static includeComponent(path: string): void {
		BuildEngine.componentPaths.add(path);
	}

	static generateComponentImport(): string {
		const importTemapate = (path: string) => `import '${path}';`;
		return Array.from(BuildEngine.componentPaths).map((path) => importTemapate(path)).join('\n');
	}

	static generateSetup(): string {
		const importTemapate = (path: string, name: string) => `import ${name} from '${path}';`;
		const functionTemplate = (name: string) => `${name}('${name}')`;
		const setupTemplate = (imports: string[], functions: string[]) => `
		${imports.join('\n')}
		import { setup } from '@embodi/generator';

		export default async () => setup({
			elements: [${functions.join(',')}],
		});
		`;

		const imports: string[] = [];
		const functions: string[] = [];

		BuildEngine.elementPaths.forEach((value, key) => {	
			imports.push(importTemapate(value, key));
			functions.push(functionTemplate(key));
		})

		return setupTemplate(imports, functions);

	}

	protected getActionByName(name: string): buildAction | undefined {
		const upperCaseName = name.toUpperCase();
		return BuildEngine.actions.get(upperCaseName);

	}

	protected async computeHelper(data: ElementData): Promise<ElementData> {

		const action = this.getActionByName(data.type);
		if (action) {
			return action(data, this);
		}
		return data;
	}

	async compute(data: ElementData): Promise<ElementData>;
	async compute(data: ElementData[]): Promise<ElementData[]>;
	async compute(data: ElementData | ElementData[]) {
		if (Array.isArray(data)) {
			return Promise.all(data.map(this.computeHelper.bind(this)));
		} else {
			return this.computeHelper(data);
		}
	}

	async copyAsset(path: string, folder: string): Promise<string> {
		const source = resolve(this.path, path);
		const destination = resolve('./static', `.${folder}`, basename(path));
		await fs.copyFile(source, destination);
		return destination;
	}

	async storeAsset(content: Buffer | string, name: string, fileType: string): Promise<string> {

		const queryHash = createHash('sha1').update(JSON.stringify(content)).digest('hex');
		//static path for source from browser

		const path = `files_/${name.replaceAll(' ', '_')}-${queryHash}.${fileType}`;
		//static path for source from browser
		const referenceId = this.viteContext.emitFile({
			type: 'asset',
			fileName: path,
			needsCodeReference: false,
			source: content
		});

		return await `${this.viteContext.getFileName(referenceId)}`;
	}
}
