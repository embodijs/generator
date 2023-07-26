import { getBuildFuntion } from './register';
import { createHash } from 'node:crypto';
import type { ElementData, JsonMap, RenderHelper, imagePath } from '@embodi/types';
import { promises as fs } from 'node:fs';
import { resolve, basename, extname } from 'node:path';
import { ElementNotFoundException } from '$lib/expections/template';

export default class RenderEngine implements RenderHelper {
	constructor(
		private svelteFetch: typeof fetch,
		private path: string
	) {}

	createEngine(path: string) {
		return new RenderEngine(this.svelteFetch, resolve(this.path, path));
	}

	fetch(...args: Parameters<typeof fetch>) {
		return this.svelteFetch(...args);
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

	private async computeHelper(data: ElementData): Promise<ElementData> {
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
		const path = `/files_/${name.replaceAll(' ', '_')}-${queryHash}.${fileType}`;
		await fs.writeFile(resolve('./static', `.${path}`), content);

		return path;

	}
}
