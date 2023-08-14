
import type { JsonMap } from '$exports/types';
import crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ContentManager<T = any> {
	protected basePath: string;
	protected config: JsonMap;
	protected static manager = new Map<string, ContentManager>();

	constructor(basePath: string, config: JsonMap = {}) {
		this.basePath = basePath;
		this.config = config;
		const hash = crypto
			.createHash('sha1')
			.update(
				JSON.stringify({
					basePath,
					...config,
					name: this.constructor.name
				})
			)
			.digest('hex');
		if (ContentManager.manager.has(hash)) {
			return <this>ContentManager.manager.get(hash);
		}
		ContentManager.manager.set(hash, this);
	}

	abstract has(identifier: string): Promise<boolean>;
	abstract load(identifier: string): Promise<T>;
	abstract put(identifier: string, content: T): Promise<void>;
	abstract delete(identifier: string): Promise<void>;
	abstract listOfIdentifiers(...type: string[]): Promise<string[]>;
}
