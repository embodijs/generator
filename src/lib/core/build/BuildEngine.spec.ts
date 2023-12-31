import { faker } from "@faker-js/faker";
import BuildEngine from "./BuildEngine";
import { resolve } from "node:path";
import type { ResolvedId, PluginContext, ModuleInfo } from "rollup"
import type { VitePluginContext } from "./contextHandlers";
import { nanoid } from "nanoid";
import SetupGenerator from "./SetupGenerator";

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

            const setupGenerator = new SetupGenerator();
            const engine = new BuildEngine("./test",  getMockedPluginContext(), setupGenerator);;
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
            const setupGenerator = new SetupGenerator();
            const engine = new BuildEngine("./test",  getMockedPluginContext(), setupGenerator);;
            const data = await engine.load(`ape.${ext}`);
            expect(data).toEqual(Buffer.from(image));

            
        });

        test("should load a text file", async () => {
            const text = faker.lorem.paragraph();
            returnData = text;
            const setupGenerator = new SetupGenerator();
            const engine = new BuildEngine("./test",  getMockedPluginContext(), setupGenerator);;
            const data = await engine.load("test.txt");
            expect(data).toEqual(text);

        });
    });

    describe("test compute", () => {
        test("should compute a single element", async () => {
            const data = {
                type: faker.lorem.word(),
                id: faker.lorem.word(),
            }
            const buildFunctions = vi.fn((data) => Promise.resolve(data))
         
            const setupGenerator = new SetupGenerator();
            const engine = new BuildEngine("./test",  getMockedPluginContext(), setupGenerator);;
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
         
            const setupGenerator = new SetupGenerator();
            const engine = new BuildEngine("./test",  getMockedPluginContext(), setupGenerator);;
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
            const setupGenerator = new SetupGenerator();
            const engine = new BuildEngine("./test",  getMockedPluginContext(), setupGenerator);;
            const newEngine = engine.createEngine("sub");
            expect(newEngine).toBeInstanceOf(BuildEngine);
            expect(newEngine).not.toBe(engine);
            expect(newEngine.getPath()).toEqual(resolve("./test/sub"));
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
            const setupGenerator = new SetupGenerator();
            const engine = new BuildEngine("./test",  getMockedPluginContext(), setupGenerator);;
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
            const setupGenerator = new SetupGenerator();
            const engine = new BuildEngine("./test",  pluginContext, setupGenerator);;
            const data = Buffer.from("embodi is a nice an well tested static site generator");
            const path = await engine.storeAsset(data, name, format);
            expect(path).toMatch(new RegExp(`^/files_/${name}-[a-f0-9]+.${format}$`));
            
        });
    });

});