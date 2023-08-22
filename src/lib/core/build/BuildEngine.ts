import type { BuildHelper, BuildSetupHelper, ElementData, buildAction } from '$exports/types';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { VitePluginContext } from './contextHandlers.js';
import { AbstractBaseEngine } from '$core/elements/AbstractBaseEngine.server.js';
import { CompileException } from '$exceptions/compile.js';
import type SetupGenerator from './SetupGenerator.js';

export default class BuildEngine extends AbstractBaseEngine implements BuildHelper, BuildSetupHelper {

	protected path: string;
	protected viteContext: VitePluginContext;
	protected setupGenerator: SetupGenerator;
	protected actions: Map<string, buildAction> = new Map();
	static readonly importer: string = 'EmbodiBuildEngine';


	constructor(
		path: string,
		context: VitePluginContext,
		setupGenerator: SetupGenerator
	) {
		super(path);
		this.path = resolve(path);
		this.viteContext = context;
		this.setupGenerator = setupGenerator;
	}

	getPath() {
		return this.path;
	}

	createEngine(path: string) {
		const engine = new BuildEngine(resolve(this.path, path), this.viteContext, this.setupGenerator);
		engine.actions = this.actions;
		return engine;
	}

	registerAction<T extends ElementData, U extends ElementData = T>(action: buildAction<T, U>, ...identifiers: string[]): void {
		identifiers.forEach((identifier) => {
			//TODO: think about type conversion and remove unknwon
			this.actions.set(identifier.toUpperCase(), <buildAction>(action as unknown));
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
		this.setupGenerator.resolveComponent(path, ...identifiers);
	}

	async resolveServerActions(_path: string, ...identifiers: string[]): Promise<void> {
		const path = await this.resolveElement(_path);
		this.setupGenerator.resolveServerActions(path, ...identifiers);
	}

	async resolveClientActions(_path: string, ...identifiers: string[]): Promise<void> {
		const path = await this.resolveElement(_path);
		this.setupGenerator.resolveClientActions(path, ...identifiers);
	}

	protected getActionByName(name: string): buildAction | undefined {
		const upperCaseName = name.toUpperCase();
		return this.actions.get(upperCaseName);

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
