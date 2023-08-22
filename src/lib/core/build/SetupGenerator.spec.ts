import { resolve } from "node:path";
import SetupGenerator from "./SetupGenerator";
import { faker } from "@faker-js/faker";

describe("test setup scripts", () => {

    const prepareTestCases = (script: string, directImport = false) => {

        const loadAsDefault = directImport ? ' ' : ' \\* as ';

        return async (component: string, ...identifier: string[]) => {

            const path = resolve(component).replace('.', '\\.');
            const importRegex = new RegExp(`import${loadAsDefault}[a-zA-Z0-9-_]+ from ['"]${path}['"];`, 'gm')

            expect(script).toMatch(importRegex);
            expect(importRegex.test(script)).toBeFalsy();

            const importVariableRegex = new RegExp(`import${loadAsDefault}([a-zA-Z0-9_-]+) from ['"]${path}['"];`, 'gm')
            const [,variable] = importVariableRegex.exec(script) ?? [];

            identifier.forEach((id) => {
                const regex = new RegExp(`\\[\\s?['"]${id.toUpperCase()}['"],\\s?${variable}\\s?\\]`)
                expect(regex.exec(script)?.length).toBe(1);
            });
        }
    };

    test.each([
        ['ident1.svelte', faker.lorem.word() ],
        ['ident2.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ['ident3.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ['ident4.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ['ident5.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
    ])("should generate a client setup script with components (%s) and mulitple identifier", async (component, ...identifier: string[]) => {
        
        const setupGenerator = new SetupGenerator();
        setupGenerator.resolveComponent(component, ...identifier);

        const script = setupGenerator.generateClientSetup();

        await prepareTestCases(script, true)(component, ...identifier);
    });

    test.each([
        ['ident1.ts', faker.lorem.word() ],
        ['ident2.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ['ident3.ts', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ['ident4.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ['ident5.tsx', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
    ])("should generate a client setup script with action reference (%s) and mulitple identifier", async (component, ...identifier: string[]) => {
        const setupGenerator = new SetupGenerator();
        setupGenerator.resolveClientActions(component, ...identifier);

        const script = setupGenerator.generateClientSetup();

        await prepareTestCases(script)(component, ...identifier);
    });

    test.each([
        [['test.svelte', faker.lorem.word() ], ['test2.svelte', faker.lorem.word() ]],
        [['test.svelte', faker.lorem.word() ], ['test2.svelte', faker.lorem.word(), faker.lorem.word() ], ['test3.svelte', faker.lorem.word() ]],
        [['test.svelte', faker.lorem.word() ], ['test2.svelte', faker.lorem.word() ], ['test3.svelte', faker.lorem.word() ], ['test4.svelte', faker.lorem.word(), faker.lorem.word(), faker.lorem.word() ]],
    ])("should generate a client setup script with multiple components and identifiers (test: %#)", async (...data: string[][]) => {
        const setupGenerator = new SetupGenerator();

        data.forEach((data) => setupGenerator.resolveComponent(data[0], ...data.slice(1)));

        const script = await setupGenerator.generateClientSetup();

        await Promise.all(data.map(async (data) => prepareTestCases(script, true)(data[0], ...data.slice(1))));
    });

    test.each([
        ['ident1.ts', faker.lorem.word() ],
        ['ident2.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ['ident3.ts', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ['ident4.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        ['ident5.tsx', faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
    ])("should generate a server setup script with action reference (%s) and mulitple identifier", async (component, ...identifier: string[]) => {
        const setupGenerator = new SetupGenerator();
        setupGenerator.resolveServerActions(component, ...identifier);
        
        const script = await setupGenerator.generateServerSetup();

        await prepareTestCases(script)(component, ...identifier);
    });

    test.each([
        [['test.ts', faker.lorem.word() ], ['test2.ts', faker.lorem.word() ]],
        [['test.ts', faker.lorem.word() ], ['test2.ts', faker.lorem.word(), faker.lorem.word() ], ['test3.js', faker.lorem.word() ]],
        [['test.ts', faker.lorem.word() ], ['test2.ts', faker.lorem.word() ], ['test3.ts', faker.lorem.word() ], ['test4.js', faker.lorem.word(), faker.lorem.word(), faker.lorem.word() ]],
    ])("should generate a server setup script with multiple components and identifiers (test: %#)", async (...data: string[][]) => {
        const setupGenerator = new SetupGenerator();
        data.forEach((data) => setupGenerator.resolveServerActions(data[0], ...data.slice(1)));

        const script = await setupGenerator.generateServerSetup();

        await Promise.all(data.map(async (data) => prepareTestCases(script)(data[0], ...data.slice(1))));
    });

    
});