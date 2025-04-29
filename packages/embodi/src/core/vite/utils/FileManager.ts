import { join as joinUrl } from 'path/posix';
import { join as joinPath } from 'path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { basename, dirname, extname } from 'node:path';
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
		const htmlPath = joinUrl(url, 'index.html');
		const dataPath = joinUrl(url, 'data.json');
		const preloadDataSnippet = `<link rel="preload" type="application/json" href="${dataPath}" as="fetch" crossorigin="anonymous"></script>`;
		const html = this.template
			.replace(/%([\w.]+)%/g, (_, key) => getValue(data.data, key.split('.')))
			.replace(`<!--app-head-->`, (data.head ?? '') + preloadDataSnippet + this.head)
			.replace(`<!--app-html-->`, data.html ?? '');
		this.files.set(htmlPath, html);
		this.files.set(dataPath, JSON.stringify(data.data));

		return [htmlPath, dataPath];
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

	addAsset(name: string, content: string | Buffer) {
		const hash = this.hash(content.toString());
		const path = joinUrl('/assets', this.addHashToFileName(name, hash));
		this.files.set(path, content);
		return path;
	}

	getFile(path: string): string | Buffer | undefined {
		return this.files.get(path);
	}

	getPage(url: string): string | Buffer | undefined {
		return this.files.get(joinUrl(url, 'index.html'));
	}

	protected write(path: string, content: string | Buffer) {
		console.info(`Write file ${path}`);
		fs.mkdirSync(dirname(path), { recursive: true });
		fs.writeFileSync(path, content);
	}

	writeFiles() {
		const dest = this.baseDest;
		assert(dest);
		this.files.forEach((content, path) => {
			//TODO: get paths from config
			this.write(joinPath(dest.pages, 'static', path), content);
		});
	}
}
