import type { BuildHelper, BuildSetupHelper, ElementData, buildAction } from '$exports/types';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { VitePluginContext } from './contextHandlers.js';
import { AbstractBaseEngine } from '$core/elements/AbstractBaseEngine.server.js';
import { CompileException } from '$exceptions/compile.js';
import { nanoid } from 'nanoid';


export default class BuildEngine extends AbstractBaseEngine implements BuildHelper, BuildSetupHelper {

	protected path: string;
	protected viteContext: VitePluginContext;
	protected static actions: Map<string, buildAction> = new Map();
	protected static serverActionsPaths: Map<string, string> = new Map();
	protected static clientActionsPaths: Map<string, string> = new Map();
	protected static componentPaths = new Map<string, string>();
	static readonly importer: string = 'EmbodiBuildEngine';


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
		const resolveId = await this.viteContext.resolve(path, BuildEngine.importer, { isEntry: true })
		if(resolveId == null) {
			throw new CompileException(`Could not resolve path ${path}`)
		}
		await this.viteContext.load({
			id: resolveId.id,
			resolveDependencies: true
		});
		return path;
	}

	async resolveComponent(_path: string, ...identifiers: string[]): Promise<void> {
		const path = await this.resolveElement(_path);
		identifiers.forEach((identifier) => {
			BuildEngine.componentPaths.set(identifier.toUpperCase(), path);
		});
	}

	async resolveServerActions(_path: string, ...identifiers: string[]): Promise<void> {
		const path = await this.resolveElement(_path);
		identifiers.forEach((identifier) => {
			BuildEngine.serverActionsPaths.set(identifier.toUpperCase(), path);
		});
	}

	async resolveClientActions(_path: string, ...identifiers: string[]): Promise<void> {
		const path = await this.resolveElement(_path);
		identifiers.forEach((identifier) => {
			BuildEngine.clientActionsPaths.set(identifier.toUpperCase(), path);
		});
	}

	protected static generateSetupHelper(paths: Map<string, string>, directImport = false): [string[], string[]] {
		const importDefaultTemapate = (path: string, ident: string) => `import * as ${ident} from '${path}';`;
		const importDirectTemapate = (path: string, ident: string) => `import ${ident} from '${path}';`;
		const elementTemplate = (ident: string, imp: string) => `['${ident}', ${imp}]`;
		const imports = new Map<string, string>();
		const actions = new Map<string, string>();

		const importTemapate = directImport ? importDirectTemapate : importDefaultTemapate;


		paths.forEach((value, key) => {	
			if(!imports.has(value)) {
				imports.set(value, `i${nanoid()}`);
			}

			actions.set(key, imports.get(value) as string);
		})

		const importStrings = Array.from(imports.entries()).map(([path, ident]) => importTemapate(path, ident));
		const elementStrings = Array.from(actions.entries()).map(([ident, imp]) => elementTemplate(ident, imp));
		
		return [importStrings, elementStrings];
	}

	static generateClientSetup(): string {

		const setupTemplate = (imports: string[], actions: string[], components: string[]) => `
		${imports.join('\n')}
		import clientSetup from '@embodi/generator/client/setup';

		export default clientSetup({
			actions: [${actions.join(',')}],
			components: [${components.join(',')}],
		});
		`;

		const [actionImportStrings, actionStrings] = BuildEngine.generateSetupHelper(BuildEngine.clientActionsPaths);
		const [componentImportStrings, componentStrings] = BuildEngine.generateSetupHelper(BuildEngine.componentPaths, true);

		const importStrings = [...actionImportStrings, ...componentImportStrings];

		return setupTemplate(importStrings, actionStrings, componentStrings);

	}

	static generateServerSetup(): string {

		const setupTemplate = (imports: string[], actions: string[]) => `
		${imports.join('\n')}
		import serverSetup from '@embodi/generator/server/setup';

		export default await serverSetup({
			actions: [${actions.join(',')}],
		});
		`;

		const [importStrings, elementStrings] = BuildEngine.generateSetupHelper(BuildEngine.serverActionsPaths);

		return setupTemplate(importStrings, elementStrings);

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
