import { resolve } from "node:path";
import SetupGenerator from "./SetupGenerator";
import { UnicRandom } from "$tests/utils/random";

describe("test setup scripts", () => {

    const unic = new UnicRandom();

    afterEach(() => {
        unic.reset();
    });


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
        ['ident1.svelte', unic.getWord() ],
        ['ident2.svelte', unic.getWord(), unic.getWord(), unic.getWord()],
        ['ident3.svelte', unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord()],
        ['ident4.svelte', unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord()],
        ['ident5.svelte', unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord()],
    ])("should generate a client setup script with components (%s) and mulitple identifier", async (component, ...identifier: string[]) => {
        
        const setupGenerator = new SetupGenerator();
        setupGenerator.resolveComponent(component, ...identifier);

        const script = setupGenerator.generateClientSetup();

        await prepareTestCases(script, true)(component, ...identifier);
    });

    test.each([
        ['ident1.ts', unic.getWord() ],
        ['ident2.js', unic.getWord(), unic.getWord(), unic.getWord()],
        ['ident3.ts', unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord()],
        ['ident4.js', unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord()],
        ['ident5.tsx', unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord()],
    ])("should generate a client setup script with action reference (%s) and mulitple identifier", async (component, ...identifier: string[]) => {
        const setupGenerator = new SetupGenerator();
        setupGenerator.resolveClientActions(component, ...identifier);

        const script = setupGenerator.generateClientSetup();

        await prepareTestCases(script)(component, ...identifier);
    });

    test.each([
        [['test.svelte', 'hello' ], ['test2.svelte', 'world' ]],
        [['test.svelte', 'embodi_group' ], ['test2.svelte', 'cat', unic.getWord() ], ['test3.svelte', 'static' ]],
        [['test.svelte', 'apple' ], ['test2.svelte', 'ape' ], ['test3.svelte', unic.getWord() ], ['test4.svelte', 'miso', unic.getWord(), unic.getWord() ]],
    ])("should generate a client setup script with multiple components and identifiers (test: %#)", async (...data: string[][]) => {
        const setupGenerator = new SetupGenerator();

        data.forEach((data) => setupGenerator.resolveComponent(data[0], ...data.slice(1)));

        const script = await setupGenerator.generateClientSetup();

        await Promise.all(data.map(async (data) => prepareTestCases(script, true)(data[0], ...data.slice(1))));
    });

    test.each([
        ['ident1.ts', 'embodi' ],
        ['ident2.js', 'embodi', unic.getWord(), unic.getWord()],
        ['ident3.ts', 'embodi', unic.getWord(), unic.getWord(), unic.getWord()],
        ['ident4.js', 'embodi', unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord()],
        ['ident5.tsx', 'embodi', unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord(), unic.getWord()],
    ])("should generate a server setup script with action reference (%s) and mulitple identifier", async (component, ...identifier: string[]) => {
        const setupGenerator = new SetupGenerator();
        setupGenerator.resolveServerActions(component, ...identifier);
        
        const script = await setupGenerator.generateServerSetup();

        await prepareTestCases(script)(component, ...identifier);
    });

    test.each([
        [['test.ts', unic.getWord() ], ['test2.ts', unic.getWord() ]],
        [['test.ts', unic.getWord() ], ['test2.ts', unic.getWord(), unic.getWord() ], ['test3.js', unic.getWord() ]],
        [['test.ts', unic.getWord() ], ['test2.ts', unic.getWord() ], ['test3.ts', unic.getWord() ], ['test4.js', unic.getWord(), unic.getWord(), unic.getWord() ]],
    ])("should generate a server setup script with multiple components and identifiers (test: %#)", async (...data: string[][]) => {
        const setupGenerator = new SetupGenerator();
        data.forEach((data) => setupGenerator.resolveServerActions(data[0], ...data.slice(1)));

        const script = await setupGenerator.generateServerSetup();

        await Promise.all(data.map(async (data) => prepareTestCases(script)(data[0], ...data.slice(1))));
    });

    
});