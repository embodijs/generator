import { faker } from "@faker-js/faker";
import RenderEngine from "./RenderEngine";
import { registerBuildFunction } from "./register";
import path, { resolve } from "node:path";
import type { PluginContext } from "rollup";

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

describe("test RenderEngine", () => {

    const mockGetFileNamePath = faker.system.filePath();
    const mockViteContext = {
        getFileName: vi.fn((id: string) => Promise.resolve(mockGetFileNamePath)),
        emitFile: vi.fn((path: string, file: unknown) => { return faker.string.uuid() }),
    }as unknown as PluginContext;

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

            const engine = new RenderEngine("./test",  mockViteContext);;
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
            const engine = new RenderEngine("./test",  mockViteContext);;
            const data = await engine.load(`ape.${ext}`);
            expect(data).toEqual(Buffer.from(image));

            
        });

        test("should load a text file", async () => {
            const text = faker.lorem.paragraph();
            returnData = text;
            const engine = new RenderEngine("./test",  mockViteContext);;
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
            const buildFunctions = {
                beforeBuild: vi.fn((data) => Promise.resolve(data))
            };
            registerBuildFunction(buildFunctions, data.type);
            const engine = new RenderEngine("./test",  mockViteContext);;
            const computed = await engine.compute(data);
            expect(computed).toEqual(data);
            expect(buildFunctions.beforeBuild).toBeCalledWith(data, engine);
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

            const buildFunctions = {
                beforeBuild: vi.fn((data) => Promise.resolve(data))
            };
            const changingBuildFunctions = {
                beforeBuild: vi.fn((data) => Promise.resolve({...data, ...addedData}))
            };
            registerBuildFunction(buildFunctions, data[a].type);
            registerBuildFunction(changingBuildFunctions, data[b].type);
            registerBuildFunction(buildFunctions, data[c].type);
            const engine = new RenderEngine("./test",  mockViteContext);;
            const computed = await engine.compute(data);

            const modifiedArray = [...data];
            modifiedArray[b] = {...data[b], ...addedData};

            expect(computed).toEqual(modifiedArray);
            expect(buildFunctions.beforeBuild).toBeCalledTimes(2);
            expect(changingBuildFunctions.beforeBuild).toBeCalledTimes(1);
            expect(buildFunctions.beforeBuild).toBeCalledWith(data[a], engine);
            expect(changingBuildFunctions.beforeBuild).toBeCalledWith(data[b], engine);
            expect(buildFunctions.beforeBuild).toBeCalledWith(data[c], engine);
        });
    });

    describe("test createEngine", () => {
        test("should create a new engine", () => {
            const engine = new RenderEngine("./test",  mockViteContext);;
            const newEngine = engine.createEngine("sub");
            expect(newEngine).toBeInstanceOf(RenderEngine);
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
            const engine = new RenderEngine("./test",  mockViteContext);;
            const data = Buffer.from(faker.image.urlPlaceholder({ 
                format,
                height: 100,
                width: 100
            }));
            const type = 'png';
            const path = await engine.storeAsset(data, name, type);
            expect(path).toMatch(new RegExp(`^/files_/${name}-[a-f0-9]+.${type}$`));
            expect(writeFileFunction).toBeCalledWith(resolve('./static', `.${path}`), data);
            
        });

        test.each([
            [faker.lorem.word(), 'pdf'],
            [faker.lorem.word(), 'mp4'],
            [faker.lorem.word(), 'mp3'],
            [faker.lorem.word(), 'txt'],
            [faker.lorem.word(), 'json']
        ])('should store a file as asset with name "%s" and format "%s"', async (name, format) => {
            const engine = new RenderEngine("./test",  mockViteContext);;
            const data = Buffer.from("embodi is a nice an well tested static site generator");
            const path = await engine.storeAsset(data, name, format);
            expect(path).toMatch(new RegExp(`^/files_/${name}-[a-f0-9]+.${format}$`));
            expect(writeFileFunction).toBeCalledWith(resolve('./static', `.${path}`), data);
            
        });
    });

});