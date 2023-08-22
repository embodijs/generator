import { nanoid } from "nanoid";
import { resolve } from "node:path";


export default class SetupGenerator {

    protected static instance: SetupGenerator;
    protected serverActionPaths: Map<string, string> = new Map();
    protected clientActionPaths: Map<string, string> = new Map();
    protected componentPaths: Map<string, string> = new Map();

    resolveServerActions (path: string, ...identifiers: string[]) {
        identifiers.forEach((identifier) => {
            this.serverActionPaths.set(identifier.toUpperCase(), resolve(path));
        });
    }

    resolveClientActions (path: string, ...identifiers: string[]) {
        identifiers.forEach((identifier) => {
            this.clientActionPaths.set(identifier.toUpperCase(), resolve(path));
        });
    }

    resolveComponent (path: string, ...identifiers: string[]) {
        identifiers.forEach((identifier) => {
            this.componentPaths.set(identifier.toUpperCase(), resolve(path));
        });
    }

    protected generateSetupHelper(paths: Map<string, string>, directImport = false): [string[], string[]] {
		const importDefaultTemapate = (path: string, ident: string) => `import * as ${ident} from '${path}';`;
		const importDirectTemapate = (path: string, ident: string) => `import ${ident} from '${path}';`;
		const elementTemplate = (ident: string, imp: string) => `['${ident}', ${imp}]`;
		const imports = new Map<string, string>();
		const actions = new Map<string, string>();

		const importTemapate = directImport ? importDirectTemapate : importDefaultTemapate;

		paths.forEach((value, key) => {	
			if(!imports.has(value)) {
				imports.set(value, `embodi_${nanoid()}`);
			}

			actions.set(key, imports.get(value) as string);
		})

		const importStrings = Array.from(imports.entries()).map(([path, ident]) => importTemapate(path, ident));
		const elementStrings = Array.from(actions.entries()).map(([ident, imp]) => elementTemplate(ident, imp));
		
		return [importStrings, elementStrings];
	}

	generateClientSetup(): string {

		const setupTemplate = (imports: string[], actions: string[], components: string[]) => `
		${imports.join('\n')}
		import clientSetup from '@embodi/generator/client/setup';

		export default clientSetup({
			actions: [${actions.join(',')}],
			components: [${components.join(',')}],
		});
		`;

		const [actionImportStrings, actionStrings] = this.generateSetupHelper(this.clientActionPaths);
		const [componentImportStrings, componentStrings] = this.generateSetupHelper(this.componentPaths, true);

		const importStrings = [...actionImportStrings, ...componentImportStrings];

		return setupTemplate(importStrings, actionStrings, componentStrings);

	}

	generateServerSetup(): string {

		const setupTemplate = (imports: string[], actions: string[]) => `
		${imports.join('\n')}
		import serverSetup from '@embodi/generator/server/setup';

		export default await serverSetup({
			actions: [${actions.join(',')}],
		});
		`;

		const [importStrings, elementStrings] = this.generateSetupHelper(this.serverActionPaths);

		return setupTemplate(importStrings, elementStrings);

	}


    static getInstance() {
        if (!SetupGenerator.instance) {
            SetupGenerator.instance = new SetupGenerator();
        }
        return SetupGenerator.instance;
    }

}