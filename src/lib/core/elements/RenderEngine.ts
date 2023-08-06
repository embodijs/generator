import { getBuildFuntion } from './register.js';
import type { ElementData, JsonMap, RenderHelper, imagePath } from '$exports/types';
import { promises as fs, existsSync } from 'node:fs';
import { resolve, basename, extname, dirname } from 'node:path';
import { ElementNotFoundException } from '$exceptions/template.js';
import { createHash } from 'node:crypto';
import type { VitePluginContext } from './ContextHandlers.js';

export default class RenderEngine implements RenderHelper {

	protected path: string;
	protected viteContext: VitePluginContext;

	constructor(
		path: string,
		context: VitePluginContext
	) {
		this.path = resolve(path);
		this.viteContext = context;
	}

	getPath() {
		return this.path;
	}

	createEngine(path: string) {
		return new RenderEngine(resolve(this.path, path), this.viteContext);
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

	protected async computeHelper(data: ElementData): Promise<ElementData> {
		try {
			const element = getBuildFuntion(data.type);
			if (element.beforeBuild) {
				console.info(`Running beforeBuild for ${data.type}`);
				return element.beforeBuild(data, this);
			}
		} catch (err) {
			if (err instanceof ElementNotFoundException) {
				console.info(err.message);
			} else {
				throw err;
			}
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
