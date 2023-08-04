
import { registerBuildFunction, getBuildFuntion, setFileFolder, getFileFolder, runBeforeAll } from "./register";
import type { RenderHelper, beforeAllFunc, beforeBuildFunc } from "@embodi/types";

describe("test register", () => {
    describe("test registerBuildFunction", () => {
        test("should register a beforeBuild function", () => {
            const name = "test";
            const func: beforeBuildFunc = (data,) => Promise.resolve(data);
            registerBuildFunction({ beforeBuild: func }, name);
            expect(getBuildFuntion(name).beforeBuild).toEqual(func);
        });
        test("should register a beforeAll function", () => {
            const name = "test";
            const func: beforeAllFunc = () => Promise.resolve();
            registerBuildFunction({ beforeAll: func }, name);
            expect(getBuildFuntion(name).beforeAll).toEqual(func);
        });
        test("should register a beforeBuild and beforeAll function", () => {
            const name = "test";
            const func1: beforeBuildFunc = (data,) => Promise.resolve(data);
            const func2: beforeAllFunc = () => Promise.resolve();
            registerBuildFunction({ beforeBuild: func1, beforeAll: func2 }, name);
            expect(getBuildFuntion(name).beforeBuild).toEqual(func1);
            expect(getBuildFuntion(name).beforeAll).toEqual(func2);
        });
    });

    describe("test runBeforeAll", () => {
        test("should run all beforeAll functions", async () => {
            const name1 = "element";
            const func1: beforeAllFunc = vi.fn();
            const name2 = "elemnt2";
            const func2: beforeAllFunc = vi.fn()
            const name3 = "element4";
            const func3: beforeAllFunc = vi.fn()
            registerBuildFunction({ beforeAll: func1 }, name1);
            registerBuildFunction({ beforeAll: func2 }, name2);
            registerBuildFunction({ beforeAll: func3 }, name3);
            const helper = <RenderHelper>{};

            await runBeforeAll(helper);

            expect(func1).toBeCalledWith(helper);
            expect(func2).toBeCalledWith(helper);
            expect(func3).toBeCalledWith(helper);
        });
    });

    test.each([
        ['test'],
        ['test2', 'hinz'],
        ['test3', 'hinz', 'kunz'],
        ['embodi', 'static', 'site', 'generator'],
        ['form', 'element', 'input', 'button', 'select', 'textarea'],
        ['email', 'element', 'input', 'button', 'select', 'textarea', 'radio', 'checkbox']
    ])("should register a function with multiple names", (...names) => {
        const func: beforeBuildFunc = (data,) => Promise.resolve(data);
        registerBuildFunction({ beforeBuild: func }, ...names);

        names.forEach(name => {
            expect(getBuildFuntion(name).beforeBuild).toEqual(func);
        });
    });
        


    describe("test setFileFolder", () => {
        test("should set the file folder", () => {
            const path = "test";
            setFileFolder(path);
            expect(getFileFolder()).toEqual(path);
        });
    });

    describe("test setFileFolder", () => {
        test("should set the file folder", () => {
            const path = "test";
            setFileFolder(path);
            expect(getFileFolder()).toEqual(path);
        });
    });
});