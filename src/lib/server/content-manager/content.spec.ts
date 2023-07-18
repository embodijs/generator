import { Content } from './content';
import type { ContentManager } from './types';


class MemoryDemo implements Required<ContentManager> {
  
  data: Record<string, unknown>;

  constructor() {
    this.data = {}
  }
  
  async load (identifier: string) {
    return this.data[identifier]
  }

  async put (identifier: string, content: unknown) {
    this.data[identifier] = content;
  }

  async delete (identifier: string) {
    this.data[identifier] = undefined;
  }

  test () {}
}

describe('Content-Manager', () => {

  it('register', () => {
    const demo = new MemoryDemo()
    Content.register('Memory', demo);

    expect(Content('Memory')).toBe(demo);
  })

  it('load, put and delete', async () => {
    const id = 'Memory2';
    Content.register(id, new MemoryDemo())
    await Content(id).put('test', 'some test')

    expect(await Content(id).load('test')).toBe('some test');
    await Content(id).delete('test');
    expect(await Content(id).load('test')).toBeUndefined()
  })
})