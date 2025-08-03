import { join as joinUrl } from 'path/posix';
import { join as joinPath } from 'path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { basename, dirname, extname } from 'node:path';
import assert from 'node:assert';
import type { getSrcDestDirs } from './config.js';

type FileManagerPageData = {
	html: string;
	content: { html: string; data: Record<string, unknown> };
	head: string;
};

type BaseSrc = ReturnType<typeof getSrcDestDirs>['src'];
type BaseDest = ReturnType<typeof getSrcDestDirs>['dest'];

type FileManagerOptions = {
	head?: string;
	template?: string;
	src?: BaseSrc;
	dest?: BaseDest;
};

export function getValue(data: Record<string, any>, attr: string[]) {
	const value = data[attr[0]];
	if (!value) {
		return '';
	} else if (attr.length === 1) {
		return value;
	} else {
		return getValue(value, attr.slice(1));
	}
}

export class FileManager {
	protected files: Map<string, { content: Buffer; contentType: string; length: number }>;
	protected template: string | undefined;
	protected head: string;
	protected baseSrc: BaseSrc | undefined;
	protected baseDest: BaseDest | undefined;
	protected static instance: FileManager | undefined;

	protected constructor(options: FileManagerOptions = {}) {
		this.files = new Map();
		this.template = options.template;
		this.head = options.head ?? '';
	}

	static getInstance() {
		if (!FileManager.instance) {
			FileManager.instance = new FileManager();
		}
		return FileManager.instance;
	}

	setHead(head: string) {
		this.head = head;
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
		const htmlPath = joinUrl(url, 'index.html');
		const dataPath = joinUrl(url, 'content.json');
		const preloadDataSnippet = `<link rel="preload" type="application/json" href="${dataPath}" as="fetch" crossorigin="anonymous"></script>`;
		const html = this.template
			.replace(/%([\w.]+)%/g, (_, key) => getValue(data.content.data, key.split('.')))
			.replace(`<!--app-head-->`, (data.head ?? '') + preloadDataSnippet + this.head)
			.replace(`<!--app-html-->`, data.html ?? '');
		const htmlBuffer = Buffer.from(html);
		this.files.set(htmlPath, {
			content: htmlBuffer,
			contentType: 'text/html',
			length: htmlBuffer.length
		});
		const dataBuffer = Buffer.from(JSON.stringify(data.content));
		this.files.set(dataPath, {
			content: dataBuffer,
			contentType: 'application/json',
			length: dataBuffer.length
		});

		return [htmlBuffer, dataBuffer];
	}

	has(url: string) {
		return this.files.has(url);
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

	addAsset(name: string, content: string | Buffer, contentType: string) {
		const hash = this.hash(content.toString());
		const path = joinUrl('/assets', this.addHashToFileName(name, hash));
		const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
		this.files.set(path, { content: contentBuffer, contentType, length: contentBuffer.length });
		return path;
	}

	getFile(path: string): string | Buffer | undefined {
		return this.files.get(path)?.content;
	}

	getHeaders(path: string):
		| {
				'content-type': string;
				'content-length': number;
		  }
		| undefined {
		const file = this.files.get(path);
		if (!file) return;
		return {
			'content-type': file.contentType,
			'content-length': file.length
		};
	}

	hasPage(url: string): boolean {
		return this.files.has(joinUrl(url, 'index.html'));
	}

	getPage(url: string): { html?: Buffer; data?: Buffer } {
		const html = this.files.get(joinUrl(url, 'index.html'))?.content;
		const data = this.files.get(joinUrl(url, 'data.json'))?.content;
		return { html, data };
	}

	protected write(path: string, content: string | Buffer) {
		console.info(`Write file ${path}`);
		fs.mkdirSync(dirname(path), { recursive: true });
		fs.writeFileSync(path, content);
	}

	writeFiles() {
		const dest = this.baseDest;
		assert(dest);
		this.files.forEach(({ content }, path) => {
			//TODO: get paths from config
			this.write(joinPath(dest.pages, 'static', path), content);
		});
	}
}
