import { join } from 'path/posix';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { basename, extname } from 'node:path';
import assert from 'node:assert';
import type { getSrcDestDirs } from './config.js';

type FileManagerPageData = {
	html: string;
	data: Record<string, unknown>;
	head: string;
};

type BaseSrc = ReturnType<typeof getSrcDestDirs>['src'];
type BaseDest = ReturnType<typeof getSrcDestDirs>['dest'];

type FileManagerOptions = {
	head?: string;
	template?: string;
	src?: BaseSrc;
	dest?: BaseDest;
}

export class FileManager {
	protected files: Map<string, string | Buffer>;
	protected template: string | undefined;
	protected head: string;
	protected baseSrc: BaseSrc | undefined;
	protected baseDest: BaseDest | undefined;

	constructor(options: FileManagerOptions = {}) {
		this.files = new Map();
		this.template = options.template;
		this.head = options.head ?? '';
	}

	setTemplate(template: string) {
		this.template = template;
	}

	setBasePath(basePaths: Pick<FileManagerOptions, 'src' | 'dest'>) {
		this.baseSrc = basePaths.src;
		this.baseDest = basePaths.dest;
	}

	addPage(url: string, data: FileManagerPageData) {
		assert(this.template, 'Template is not set');
		console.log({ url, data });
		const htmlPath = join(url, 'index.html');
		const dataPath = join(url, 'data.json');
		const html = this.template
			.replace(`<!--app-head-->`, (data.head ?? '') + this.head)
			.replace(`<!--app-html-->`, data.html ?? '');
		this.files.set(htmlPath, html);
		this.files.set(dataPath, JSON.stringify(data.data));

		return [htmlPath, dataPath];
	}

	protected hash(content: string) {
		const fullHash = crypto.createHash('md5').update(content).digest();
		// Encode in Base64 and remove any padding (and non-URL friendly characters, if needed)
		const base64Hash = fullHash
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
		// Truncate to the desired length
		return base64Hash.substring(0, 8);
	}

	protected addHashToFileName(name: string, hash: string) {
		const extension = extname(name);
		const baseName = basename(name, extension);
		return `${baseName}-${hash}${extension}`;
	}

	addAsset(name: string, content: string | Buffer) {
		const hash = this.hash(content.toString());
		const path = join('/assets', this.addHashToFileName(name, hash));
		this.files.set(path, content);
		return path;
	}

	getFile(path: string): string | Buffer | undefined {
		return this.files.get(path);
	}

	getPage(url: string): string | Buffer | undefined {
		return this.files.get(join(url, 'data.json'));
	}

	protected write(path: string, content: string | Buffer) {
		console.info(`Write file ${path}`);
		fs.writeFileSync(path, content);
	}

	writeFiles() {
    const dest = this.baseDest;
		assert(dest);
		this.files.forEach((content, path) => {
			//TODO: get paths from config
			this.write(join(dest.pages, 'static', path), content);
		});
	}
}
