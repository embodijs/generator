import { faker } from "@faker-js/faker";
import BuildEngine from "./BuildEngine";
import path, { resolve } from "node:path";
import type { ResolvedId, PluginContext, ModuleInfo } from "rollup"
import type { VitePluginContext } from "./contextHandlers";
import { nanoid } from "nanoid";

let returnData: unknown;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const writeFileFunction = vi.fn(async (path: string, file: unknown) => { return; });
vi.mock("node:fs", async () => {
    return { 
        existsSync: vi.fn(() => true),
        promises: {
            readFile: vi.fn(async () => {
                return returnData;
            }),
            writeFile: (path: string, file: unknown) => writeFileFunction(path, file),
        }
}});

class MockPluginContext implements VitePluginContext {

    #filename: Record<string, string> = {};
    watchFiles = () => {return;};
    resolve = <PluginContext['resolve']>vi.fn(async (): Promise<Partial<ResolvedId>> => ({
        id: nanoid(),
        external: false,
    }));
    load = <PluginContext['load']>vi.fn(async (): Promise<Partial<ModuleInfo>> => ({}));
    getFileName = vi.fn((id: string) => `/${this.#filename[id]}`);
    emitFile = vi.fn(({fileName}) => {
        const id = faker.string.uuid();
        this.#filename[id] = fileName;
        return id;
    });
}

function getMockedPluginContext (): VitePluginContext {
    return new MockPluginContext() as unknown as VitePluginContext;
}

describe("test RenderEngine", () => {
    
   

    afterAll(() => {
        vi.restoreAllMocks();
    });

    describe("test data loading", () => {

        test("should load a json file", async () => {

            const testJson = {
                test: faker.lorem.sentence(),
                test2: faker.lorem.sentence(),
                number: faker.number.float(),
                array: [faker.lorem.sentence(), faker.lorem.sentence(), faker.lorem.sentence()],
            };

            returnData = JSON.stringify(testJson);

            const engine = new BuildEngine("./test",  getMockedPluginContext());;
            const data = await engine.load("test.json");
            expect(data).toEqual(testJson);

       
        });
 
        test.each([
            'jpeg',
            'jpg',
            'png',
            'webp',
            'gif'
        ] as const)("should load a image file (%s)", async (ext) => {
            const image = faker.image.urlPlaceholder({ 
                format: ext,
                height: 100,
                width: 100
            });
            returnData = Buffer.from(image);
            const engine = new BuildEngine("./test",  getMockedPluginContext());;
            const data = await engine.load(`ape.${ext}`);
            expect(data).toEqual(Buffer.from(image));

            
        });

        test("should load a text file", async () => {
            const text = faker.lorem.paragraph();
            returnData = text;
            const engine = new BuildEngine("./test",  getMockedPluginContext());;
            const data = await engine.load("test.txt");
            expect(data).toEqual(text);

        });
    });

    describe("test setup scripts", () => {

        const prepareFillCase = (ref: 'resolveComponent' | 'resolveClientActions' | 'resolveServerActions') => async (component: string, ...identifier: string[]) => {
            const engine = new BuildEngine("./test",  getMockedPluginContext());;
            await engine[ref](component, ...identifier);
        };

        const prepareTestCase = (script: string, directImport = false) => {

            const loadAsDefault = directImport ? ' ' : ' \\* as ';

            return async (component: string, ...identifier: string[]) => {

                const path = resolve(component).replace('.', '\\.');
                const importRegex = new RegExp(`import${loadAsDefault}[a-zA-Z]+ from ['"]${path}['"];`, 'gm')

                expect(script).toMatch(importRegex);
                expect(importRegex.test(script)).toBeFalsy();

                const importVariableRegex = new RegExp(`import${loadAsDefault}([a-zA-Z]+) from ['"]${path}['"];`, 'gm')
                const [,variable] = importVariableRegex.exec(script) ?? [];

                identifier.forEach((id) => {
                    const regex = new RegExp(`\\[\\s?['"]${id.toUpperCase()}['"],\\s?${variable}\\s?\\]`)
                    expect(regex.exec(script)?.length).toBe(1);
                });
            }
        };

        class MockBuildEngine extends BuildEngine {
            public static resetStatic () {
                BuildEngine.componentPaths = new Map();
                BuildEngine.clientActionsPaths = new Map();
                BuildEngine.serverActionsPaths = new Map();
            }
        }

        beforeEach(() => {
            MockBuildEngine.resetStatic();
        });

        test.each([
            ['ident1.svelte', faker.lorem.word() ],
            ['ident2.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
            ['ident3.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
            ['ident4.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
            ['ident5.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ])("should generate a client setup script with components (%s) and mulitple identifier", async (component, ...identifier: string[]) => {
            await prepareFillCase('resolveComponent')(component, ...identifier);
            const script = await BuildEngine.generateClientSetup();

            await prepareTestCase(script, true)(component, ...identifier);
        });

        test.each([
            ['ident1.ts', faker.lorem.word() ],
            ['ident2.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
            ['ident3.ts', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
            ['ident4.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
            ['ident5.tsx', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ])("should generate a client setup script with action reference (%s) and mulitple identifier", async (component, ...identifier: string[]) => {
            await prepareFillCase('resolveClientActions')(component, ...identifier);
            const script = await BuildEngine.generateClientSetup();

            await prepareTestCase(script)(component, ...identifier);
        });

        test.each([
            [['test.svelte', faker.lorem.word() ], ['test2.svelte', faker.lorem.word() ]],
            [['test.svelte', faker.lorem.word() ], ['test2.svelte', faker.lorem.word(), faker.lorem.word() ], ['test3.svelte', faker.lorem.word() ]],
            [['test.svelte', faker.lorem.word() ], ['test2.svelte', faker.lorem.word() ], ['test3.svelte', faker.lorem.word() ], ['test4.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word() ]],
        ])("should generate a client setup script with multiple components and identifiers (test: %#)", async (...data: string[][]) => {
            await Promise.all(data.map(async (data) => prepareFillCase('resolveComponent')(data[0], ...data.slice(1))));

            const script = await BuildEngine.generateClientSetup();

            await Promise.all(data.map(async (data) => prepareTestCase(script, true)(data[0], ...data.slice(1))));
        });

        test.each([
            ['ident1.ts', faker.lorem.word() ],
            ['ident2.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
            ['ident3.ts', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
            ['ident4.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
            ['ident5.tsx', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ])("should generate a server setup script with action reference (%s) and mulitple identifier", async (component, ...identifier: string[]) => {
            await prepareFillCase('resolveServerActions')(component, ...identifier);
            
            const script = await BuildEngine.generateServerSetup();

            await prepareTestCase(script)(component, ...identifier);
        });

        test.each([
            [['test.ts', faker.lorem.word() ], ['test2.ts', faker.lorem.word() ]],
            [['test.ts', faker.lorem.word() ], ['test2.ts', faker.lorem.word(), faker.lorem.word() ], ['test3.js', faker.lorem.word() ]],
            [['test.ts', faker.lorem.word() ], ['test2.ts', faker.lorem.word() ], ['test3.ts', faker.lorem.word() ], ['test4.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word() ]],
        ])("should generate a server setup script with multiple components and identifiers (test: %#)", async (...data: string[][]) => {
            await Promise.all(data.map(async (data) => prepareFillCase('resolveServerActions')(data[0], ...data.slice(1))));

            const script = await BuildEngine.generateServerSetup();

            await Promise.all(data.map(async (data) => prepareTestCase(script)(data[0], ...data.slice(1))));
        });

        
    });

    describe("test compute", () => {
        test("should compute a single element", async () => {
            const data = {
                type: faker.lorem.word(),
                id: faker.lorem.word(),
            }
            const buildFunctions = vi.fn((data) => Promise.resolve(data))
         
            const engine = new BuildEngine("./test",  getMockedPluginContext());;
            engine.registerAction(buildFunctions, data.type);
            
            const computed = await engine.compute(data);
            expect(computed).toEqual(data);
            expect(buildFunctions).toBeCalledWith(data, engine);
        });

        test.each([
            [0,1,2],
            [1,2,0],
            [2,0,1]
        ] as number[][])("should compute a array of elements with changing order (%i, %i, %i)", async (a,b,c) => {

            const data = [{
                type: faker.lorem.word(),
                id: faker.lorem.word(),
            }, {
                type: faker.lorem.word(),
                id: faker.lorem.word(),
            }, {
                type: faker.lorem.word(),
                id: faker.lorem.word(),
            }];

            const addedData = {image: faker.image.url()};

            const buildFunctions = vi.fn((data) => Promise.resolve(data))
        
            const changingBuildFunctions = vi.fn((data) => Promise.resolve({...data, ...addedData}))
         
            const engine = new BuildEngine("./test",  getMockedPluginContext());;
            engine.registerAction(buildFunctions, data[a].type);
            engine.registerAction(changingBuildFunctions, data[b].type);
            engine.registerAction(buildFunctions, data[c].type);
            
            const computed = await engine.compute(data);

            const modifiedArray = [...data];
            modifiedArray[b] = {...data[b], ...addedData};

            expect(modifiedArray).toEqual(computed);
            expect(buildFunctions).toBeCalledTimes(2);
            expect(changingBuildFunctions).toBeCalledTimes(1);
            expect(buildFunctions).toBeCalledWith(data[a], engine);
            expect(changingBuildFunctions).toBeCalledWith(data[b], engine);
            expect(buildFunctions).toBeCalledWith(data[c], engine);
        });
    });

    describe("test createEngine", () => {
        test("should create a new engine", () => {
            const engine = new BuildEngine("./test",  getMockedPluginContext());;
            const newEngine = engine.createEngine("sub");
            expect(newEngine).toBeInstanceOf(BuildEngine);
            expect(newEngine).not.toBe(engine);
            expect(newEngine.getPath()).toEqual(path.resolve("./test/sub"));
        });
    });

    describe("test storeAsset", () => {
        test.each([
            [faker.lorem.word(), 'png'],
            [faker.lorem.word(), 'jpg'],
            [faker.lorem.word(), 'jpeg'],
            [faker.lorem.word(), 'webp'],
            [faker.lorem.word(), 'gif']
        ] as const)('should store a image as asset with name "%s" and format "%s"', async (name, format) => {
            const engine = new BuildEngine("./test",  getMockedPluginContext());;
            const data = Buffer.from(faker.image.urlPlaceholder({ 
                format,
                height: 100,
                width: 100
            }));
            const type = 'png';
            const path = await engine.storeAsset(data, name, type);
            expect(path).toMatch(new RegExp(`^/files_/${name}-[a-f0-9]+.${type}$`));
            
        });

        test.each([
            [faker.lorem.word(), 'pdf'],
            [faker.lorem.word(), 'mp4'],
            [faker.lorem.word(), 'mp3'],
            [faker.lorem.word(), 'txt'],
            [faker.lorem.word(), 'json']
        ])('should store a file as asset with name "%s" and format "%s"', async (name, format) => {
            const pluginContext = getMockedPluginContext();
            const engine = new BuildEngine("./test",  pluginContext);;
            const data = Buffer.from("embodi is a nice an well tested static site generator");
            const path = await engine.storeAsset(data, name, format);
            expect(path).toMatch(new RegExp(`^/files_/${name}-[a-f0-9]+.${format}$`));
            
        });
    });

});