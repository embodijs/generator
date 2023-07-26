import { faker } from "@faker-js/faker";
import RenderEngine from "./RenderEngine";
import { registerBuildFunction } from "./register";
import path from "node:path";

let returnData: unknown;
vi.mock("node:fs", async () => {
    return { promises: {
        readFile: vi.fn(async () => {
            return returnData;
        })
    }
}});

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

            const engine = new RenderEngine(vi.fn(), "./test");
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
            const engine = new RenderEngine(vi.fn(), "./test");
            const data = await engine.load(`ape.${ext}`);
            expect(data).toEqual(Buffer.from(image));

            
        });

        test("should load a text file", async () => {
            const text = faker.lorem.paragraph();
            returnData = text;
            const engine = new RenderEngine(vi.fn(), "./test");
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
            registerBuildFunction(data.type, buildFunctions);
            const engine = new RenderEngine(vi.fn(), "./test");
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
            registerBuildFunction(data[a].type, buildFunctions);
            registerBuildFunction(data[b].type, changingBuildFunctions);
            registerBuildFunction(data[c].type, buildFunctions);
            const engine = new RenderEngine(vi.fn(), "./test");
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
            const engine = new RenderEngine(vi.fn(), "./test");
            const newEngine = engine.createEngine("sub");
            expect(newEngine).toBeInstanceOf(RenderEngine);
            expect(newEngine).not.toBe(engine);
            expect(newEngine.getPath()).toEqual(path.resolve("./test/sub"));
        });
    });

});