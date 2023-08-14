import type { JsonMap } from '$exports/types';
import fs from 'fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { ContentNotFoundException } from '../exceptions/contentNotFoundException.js';
import { ContentManager } from '../contentManager.js';
import type { AbortException } from '../types.js';
import { searchJsonByMongoQuery, type Query } from './filesystem.helper.js';

export type supportedContentTypes = 'JSON' | 'TEXT';

export interface FilesystemBaseOptions extends JsonMap {
	encoding?: BufferEncoding;
}

abstract class FilesystemBase extends ContentManager {
	constructor(basePath: string, options: FilesystemBaseOptions = {}) {
		const resolvedPath = path.resolve(process.cwd(), basePath);
		super(resolvedPath, options);
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	abstract load(identifier: string): Promise<any>;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async put(identifier: string, content: any) {
		const location = path.join(this.basePath, identifier);
		try {
			await fs.writeFile(location, content);
		} catch (err) {
			if (typeof err === 'object') {
				const { code, errno, syscall } = <AbortException>err;
				if (code === 'ENOENT' && errno === -2 && syscall === 'open') {
					await fs.mkdir(path.dirname(location), { recursive: true });
					await fs.writeFile(location, content);
					return;
				}
			}
			throw err;
		}
	}

	async delete(identifier: string) {
		await fs.rm(path.join(this.basePath, identifier));
	}

	async has(identifier: string) {
		return new Promise<boolean>((resolve, reject) => {
			try {
				const exists = fsSync.existsSync(path.join(this.basePath, identifier));
				resolve(exists);
			} catch (err) {
				reject(err);
			}
		});
	}

	protected async listDir(basePath: string): Promise<string[]> {
		const pathContent = await fs.readdir(basePath, { withFileTypes: true });

		const files = await Promise.all(
			pathContent.map(async (dir): Promise<string | string[]> => {
				if (dir.isDirectory()) {
					const list = await this.listDir(path.join(basePath, dir.name));
					return list.map((name) => path.join(dir.name, name));
				}

				return dir.name;
			})
		);

		return files.flat();
	}

	async listOfIdentifiers(...ext: string[]): Promise<string[]> {
		const files = await this.listDir(this.basePath);

		return ext.length === 0 ? files : files.filter((name) => ext.includes(path.extname(name)));
	}
}

export class Filesystem extends FilesystemBase implements ContentManager {
	protected encoding: BufferEncoding | undefined;

	constructor(basePath: string, encoding?: BufferEncoding) {
		super(basePath, {
			encoding
		});
		this.encoding = encoding;
	}

	async load(identifier: string): Promise<Buffer | string> {
		const content = await fs.readFile(path.join(this.basePath, identifier), this.encoding);
		if (!content) {
			throw new ContentNotFoundException(identifier);
		}

		return content;
	}

	async put(identifier: string, content: string) {
		await super.put(identifier, content);
	}
}

interface JsonFilesystemConfig {
	postfix?: string;
}

interface JsonFilesystemConfigIntern extends FilesystemBaseOptions {
	postfix: string;
	encoding: 'utf8';
}

export class JsonFilesystem<T extends JsonMap> extends FilesystemBase implements ContentManager<T> {

	config: JsonFilesystemConfigIntern;
	modified: Date;

	constructor(basePath: string, options?: JsonFilesystemConfig) {
		const config = {
			postfix: options?.postfix == null ? '.json' : `.${options.postfix}.json`,
			encoding: 'utf8' as const
		};
		super(basePath, config);
		this.config = config;
		this.modified = new Date();
	}

	protected fullFileName(identifier: string): string {
		return `${identifier}${this.config.postfix}`;
	}

	override async has(identifier: string): Promise<boolean> {
		return super.has(this.fullFileName(identifier));
	}

	override async load(identifier: string): Promise<T> {
		const content = await fs.readFile(
			path.join(this.basePath, this.fullFileName(identifier)),
			'utf8'
		);
		return JSON.parse(content);
	}

	async find(query: Query<T>) {

		const identifiers = await this.listOfIdentifiers();
		const allFiles: T[] = await Promise.all(
			identifiers.map((id) => {
				return this.load(id);
			})
		);

		return searchJsonByMongoQuery(query, allFiles);;
	}

	override async put(identifier: string, content: T, partial?: false): Promise<void>;
	override async put(identifier: string, content: Partial<T>, partial?: true): Promise<void>;
	override async put(identifier: string, content: T | Partial<T>, partial = false) {
		if (partial && (await this.has(identifier))) {
			const old = await this.load(identifier);
			content = {
				...old,
				...content
			};
		}
		const stringified = JSON.stringify(content);
		const location = path.join(this.basePath, this.fullFileName(identifier));
		try {
			await fs.writeFile(location, stringified);
		} catch (err) {
			if (typeof err === 'object') {
				const { code, errno, syscall } = <AbortException>err;
				if (code === 'ENOENT' && errno === -2 && syscall === 'open') {
					await fs.mkdir(path.dirname(location), { recursive: true });
					await fs.writeFile(location, stringified);
					return;
				}
			}
			throw err;
		}
	}

	override async listOfIdentifiers(): Promise<string[]> {
		const removePostfix = this.config.postfix.length * -1;
		return (await super.listOfIdentifiers(this.config.postfix)).map((v) =>
			v.slice(0, removePostfix)
		);
	}
}
