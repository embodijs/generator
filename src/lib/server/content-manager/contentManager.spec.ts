import { ContentManager } from "./contentManager";

class TestManager extends ContentManager {
  has () {
    return Promise.resolve(false)
  }
  load () {
    return Promise.resolve()
  }
  put () {
    return Promise.resolve();
  }
  delete () {
    return Promise.resolve();
  }
  listOfIdentifiers(): Promise<string[]> {
    return Promise.resolve([]);
  }

}

describe('Content-Manager: Abstract base class by extending', () => {
  it('no duplicates', () => {
    const m1 = new TestManager('test', {test:'m1'})
    const m2 = new TestManager('test', {test:'m1'})
    const m4 = new TestManager('test/a', {test:'m1'})
    const m3 = new TestManager('test', {test:'m3'})

    expect(m1).equals(m2);
    expect(m1).not.equals(m3);
    expect(m1).not.equals(m4);

    expect(m2).not.equals(m3);
    expect(m2).not.equals(m4);

    expect(m3).not.equals(m1);
    expect(m3).not.equals(m4);




  })
})