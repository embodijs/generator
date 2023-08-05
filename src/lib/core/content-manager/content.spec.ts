import { Content } from './content';
import { ContentManager } from './contentManager';

class MemoryDemo extends ContentManager {
	data: Record<string, unknown>;

	constructor() {
		super('./');
		this.data = {};
	}

	async load(identifier: string) {
		return this.data[identifier];
	}

	async put(identifier: string, content: unknown) {
		this.data[identifier] = content;
	}

	async delete(identifier: string) {
		this.data[identifier] = undefined;
	}

	async has(identifier: string): Promise<boolean> {
		return Object.hasOwn(this.data, identifier);
	}

	async listOfIdentifiers(): Promise<string[]> {
		return ['test'];
	}

	test() {}
}

describe('Content-Manager', () => {
	it('register', () => {
		const demo = new MemoryDemo();
		Content.register('Memory', demo);

		expect(Content('Memory')).toBe(demo);
	});

	it('load, put and delete', async () => {
		const id = 'Memory2';
		Content.register(id, new MemoryDemo());
		await Content(id).put('test', 'some test');

		expect(await Content(id).load('test')).toBe('some test');
		await Content(id).delete('test');
		expect(await Content(id).load('test')).toBeUndefined();
	});
});
