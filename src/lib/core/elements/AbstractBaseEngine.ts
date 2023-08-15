import type { JsonMap, imagePath } from "$exports";
import { resolve, extname } from "node:path";
import { promises as fs } from "fs";

export abstract class AbstractBaseEngine {

    constructor(protected path: string) {
        this.path = resolve(path);
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
}