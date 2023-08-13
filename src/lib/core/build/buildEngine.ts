import type { BuildHelper, BuildSetupHelper, ElementData, JsonMap, buildAction, imagePath } from '$exports/types';
import { promises as fs, existsSync } from 'node:fs';
import { resolve, basename, extname, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import type { VitePluginContext } from './contextHandlers.js';




export default class BuildEngine implements BuildHelper, BuildSetupHelper {

	protected path: string;
	protected viteContext: VitePluginContext;
	protected static actions: Map<string, buildAction> = new Map();
	protected static elementPaths: Map<string, string> = new Map();

	constructor(
		path: string,
		context: VitePluginContext,
	) {
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

	includeElement(path: string, ...indetifiers: string[]): void {
		const rPath = resolve(path);
		indetifiers.forEach((identifier) => {
			BuildEngine.elementPaths.set(identifier.toUpperCase(), rPath);
		});
	}

	static generateSetup(): string {
		const importTemapate = (path: string, name: string) => `import ${name} from '${path}';`;
		const functionTemplate = (name: string) => `${name}('${name}')`;
		const setupTemplate = (imports: string[], functions: string[]) => `
		${imports.join('\n')}
		import { setup } from '@embodi/generator';

		export default () => setup({
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

	async load(path: imagePath): Promise<Buffer>;
	async load<T extends JsonMap = JsonMap>(path: string): Promise<T>;
	async load(path: string): Promise<unknown> {
		if (path.endsWith('.json')) {
			return JSON.parse(await fs.readFile(resolve(this.path, path), 'utf-8'));
		} else if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(extname(path))) {
			return fs.readFile(resolve(this.path, path));
		} else {
			return fs.readFile(resolve(this.path, path), 'utf-8');
		}
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

	protected async createPathIfNotExists(path: string) {
		const folderPath = dirname(path);
		if(!existsSync(folderPath)){
			await fs.mkdir(folderPath, { recursive: true });
		}
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
		const resolveId = this.viteContext.emitFile({
			type: 'asset',
			fileName: path,
			source: content
		});

		return await this.viteContext.getFileName(resolveId);
	}
}
