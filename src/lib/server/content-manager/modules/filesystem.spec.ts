import { Filesystem, JsonFilesystem } from './filesystem';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, resolve } from 'node:path';

import { faker } from '@faker-js/faker';
import { createRandomArray } from '$tests/utils/random';

async function createFiles(base: string, paths: string[]) {
	return Promise.all(
		paths.map(async (path) => {
			const fullPath = join(base, path);
			await fs.mkdir(dirname(fullPath), { recursive: true });
			await fs.writeFile(fullPath, faker.string.alphanumeric());
		})
	);
}
describe('Content-Manager: Filesystem', () => {
	describe('Class Storage Test', () => {
		it('Same Path but different Object', () => {
			const ident = 'content/templates';
			const fmanager = new Filesystem(ident);
			const jmanager = new JsonFilesystem(ident);
			expect(fmanager).not.toBe(jmanager);
		});

		it('same Path, same object (Filesystem)', () => {
			const ident = 'test/monky/test';
			const m1 = new Filesystem(ident);
			const m2 = new Filesystem(ident);
			expect(m1).toBe(m2);
		});

		it('same path, same object (JsonFilesystem)', () => {
			const ident = 'monkey/humen/vally';
			const m1 = new JsonFilesystem(ident);
			const m2 = new JsonFilesystem(ident);
			expect(m1).toBe(m2);
		});
	});

	describe('Filesystem', () => {
		let TEST_BASE_PATH: string;

		const testPaths = [
			'test/some/text.txt',
			'have/some/rich.md',
			'get/some/other/level/of/deepness/in.html',
			'maybe/something/.hidden/in/a/folder.ts',
			'index.html',
			'app.css',
			'images/empty.webp'
		];

		beforeAll(async () => {
			TEST_BASE_PATH = faker.string.uuid();
			await fs.mkdir(TEST_BASE_PATH);

			await fs.mkdir(TEST_BASE_PATH, { recursive: true });
			for (let i = 0; i < 7; i++) {
				testPaths.push(faker.system.filePath().replace('/', ''));
			}
			await createFiles(TEST_BASE_PATH, testPaths);
		});

		afterAll(async () => {
			await fs.rm(TEST_BASE_PATH, { force: true, recursive: true });
		});

		it('list all in dir', async () => {
			const manager = new Filesystem(TEST_BASE_PATH, 'utf-8');
			const list = await manager.listOfIdentifiers();
			expect(list).toEqual(testPaths.sort());
		});

		it('write file', async () => {
			const manager = new Filesystem(TEST_BASE_PATH);
			const image = faker.image.urlLoremFlickr({ category: 'city' });
			await manager.put('city_image.jpg', image);

			expect((await fs.readFile(join(TEST_BASE_PATH, 'city_image.jpg'))).toString()).toBe(
				image.toString()
			);
		});

		it('write to sub dir', async () => {
			const file = '/cities/city_image.jpg';
			const manager = new Filesystem(TEST_BASE_PATH);
			const image = faker.image.urlLoremFlickr({ category: 'city' });
			await manager.put(file, image);

			expect((await fs.readFile(join(TEST_BASE_PATH, file))).toString()).toBe(image.toString());
		});

		it('file exists', async () => {
			const manager = new Filesystem(TEST_BASE_PATH);
			const exists = await manager.has(testPaths[5]);

			expect(exists).toBeTruthy();
		});

		it('file exists with path', async () => {
			const manager = new Filesystem(TEST_BASE_PATH);
			const exists = await manager.has(testPaths[3]);

			expect(exists).toBeTruthy();
		});

		it('file does not exists', async () => {
			const manager = new Filesystem(TEST_BASE_PATH);
			const exists = await manager.has('randomFileNadf-e-.fsd');

			expect(exists).toBeFalsy();
		});

		it('read file', async () => {
			const image = faker.image.urlLoremFlickr({ category: 'cats' });
			await fs.writeFile(join(TEST_BASE_PATH, 'cat_image.png'), image);

			const manager = new Filesystem(TEST_BASE_PATH);
			expect((await manager.load('cat_image.png')).toString()).toBe(image);
		});

		it('read from sub dir', async () => {
			const location = 'subdir/cat_image.png';
			const image = faker.image.urlLoremFlickr({ category: 'cats' });
			await fs.mkdir(dirname(join(TEST_BASE_PATH, location)));
			await fs.writeFile(join(TEST_BASE_PATH, location), image);

			const manager = new Filesystem(TEST_BASE_PATH);
			expect((await manager.load(location)).toString()).toBe(image);
		});

		it('create only one with same config', () => {
			const manager1 = new Filesystem(TEST_BASE_PATH);
			const manager2 = new Filesystem(TEST_BASE_PATH);
			const manager3 = new Filesystem(TEST_BASE_PATH, 'utf-8');

			expect(manager1).not.toBe(manager3);
			expect(manager1).toBe(manager2);
		});

		test('resolve path', () => {
			class TestManager extends Filesystem {
				public resolvePath() {
					return this.basePath;
				}
			}

			const relative = '../test/monkey/path/test';
			const manager = new TestManager(relative);
			expect(manager.resolvePath()).toBe(resolve(process.cwd(), relative));
		});
	});

	describe('JsonFilesystem', () => {
		let TEST_BASE_PATH: string;

		const testPaths = [
			'test/some/text.txt',
			'have/some/rich.json',
			'get/some/other/level/of/deepness/in.html',
			'maybe/something/.hidden/in/a/folder.ts',
			'index.html',
			'app.css',
			'images/empty.webp',
			'template.json'
		];

		beforeAll(async () => {
			TEST_BASE_PATH = faker.string.uuid();
			await fs.mkdir(TEST_BASE_PATH);

			await fs.mkdir(TEST_BASE_PATH, { recursive: true });
			for (let i = 0; i < 7; i++) {
				testPaths.push(faker.system.filePath().replace('/', ''));
			}
			await createFiles(TEST_BASE_PATH, testPaths);
		});

		afterAll(async () => {
			await fs.rm(TEST_BASE_PATH, { force: true, recursive: true });
		});

		it('list all in dir', async () => {
			const manager = new JsonFilesystem(TEST_BASE_PATH);
			const list = await manager.listOfIdentifiers();
			expect(list).toEqual(['have/some/rich', 'template']);
		});

		it('write object', async () => {
			const obj = {
				arr: createRandomArray(3, 54),
				i: faker.number.int(),
				f: faker.number.float(),
				s: faker.string.sample()
			};

			const manager = new JsonFilesystem(TEST_BASE_PATH);
			await manager.put('obj', obj);
			expect(await fs.readFile(join(TEST_BASE_PATH, 'obj.json'), 'utf-8')).toEqual(
				JSON.stringify(obj)
			);
		});

		// it('wirte array to sub dir', async () => {
		//   const arr = faker.datatype.array();
		//   const location = 'ape/test'
		//   const manager = new JsonFilesystem(TEST_BASE_PATH);
		//   await manager.put(location, arr);
		//   expect(await fs.readFile(join(TEST_BASE_PATH, `${location}.json`), 'utf-8')).toBe(JSON.stringify(arr));
		// })

		it('read json', async () => {
			const obj = {
				arr: createRandomArray(3, 57),
				i: faker.number.int(),
				f: faker.number.float(),
				s: faker.string.sample()
			};

			await fs.writeFile(join(TEST_BASE_PATH, 'read.json'), JSON.stringify(obj));
			const manager = new JsonFilesystem(TEST_BASE_PATH);
			const data = await manager.load('read');

			expect(data).toEqual(obj);
		});

		it('find files', async () => {
			const subdir = join(TEST_BASE_PATH, 'find_files');
			const list = [
				{ easy: ['some'] },
				{ easy: ['other'] },
				{ easy: ['tow', 'some'] },
				{ easy: ['one', 'two'] }
			];

			const manager = new JsonFilesystem(subdir);
			await Promise.all(
				list.map((elem) => {
					return manager.put(faker.string.uuid(), elem);
				})
			);
			const result = await manager.find({
				easy: 'some'
			});

			expect(Array.isArray(result)).toBeTruthy();
			expect(result.length).toBe(2);
			expect(result[0].easy).include('some');
			expect(result[1].easy).include('some');
		});

		it('create only one with same config', () => {
			const manager1 = new JsonFilesystem(TEST_BASE_PATH);
			const manager2 = new JsonFilesystem(TEST_BASE_PATH);
			const manager3 = manager1;

			expect(manager1).toBe(manager3);
			expect(manager1).toBe(manager2);
		});

		it('get partial data but save all', async () => {
			const filename = 'test/test';
			const f = {
				test: {
					sub: 1
				},
				test2: 'change',
				content: [{ some: 'item' }]
			};
			const manager = new JsonFilesystem(TEST_BASE_PATH);
			await manager.put(filename, f);

			const content = JSON.parse(
				(await fs.readFile(join(TEST_BASE_PATH, `${filename}.json`))).toString()
			);

			expect(content).toEqual(f);

			const n = {
				test2: 'new',
				content: [{ elemnt: 'test' }]
			};

			await manager.put(filename, n, true);
			const changedContent = JSON.parse(
				(await fs.readFile(join(TEST_BASE_PATH, `${filename}.json`))).toString()
			);

			expect(changedContent).toEqual({
				...f,
				...n
			});
		});

		it('set postfix correct', async () => {
			const manager = new JsonFilesystem(TEST_BASE_PATH, { postfix: 'test' });

			await manager.put('file', { t: 1 });

			expect(existsSync(join(TEST_BASE_PATH, `file.test.json`)));
			expect(await manager.has('file')).toBeTruthy();

			const reloaded = await manager.load('file');
			expect(reloaded).toEqual({ t: 1 });
		});
	});
});
