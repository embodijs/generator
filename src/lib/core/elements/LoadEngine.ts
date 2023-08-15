import type { ElementData, LoadHelper, PageFile, loadAction } from "$exports";
import { AbstractBaseEngine } from "./AbstractBaseEngine";

export default class LoadEngine extends AbstractBaseEngine implements LoadHelper {

    protected static actions: Map<string, loadAction> = new Map();

    constructor(
        protected path: string, 
        protected svleteFetch: typeof fetch,
        protected page: PageFile
    ) {
        super(path);
    }

    static registerAction(action: loadAction, ...identifier: string[]) {
        identifier.forEach(id => this.actions.set(id, action));
    }

    static hasActions(): boolean {
        return LoadEngine.actions.size !== 0;
    }

    createEngine(path: string): LoadHelper {
        return new LoadEngine(path, this.svleteFetch, this.page);
    }

    fetch(path: string, init?: RequestInit): Promise<Response> {
        return this.svleteFetch(path, init);
    }

    protected getActionByName(name: string): loadAction | undefined {
		const upperCaseName = name.toUpperCase();
		return LoadEngine.actions.get(upperCaseName);

	}

	protected async computeHelper(data: ElementData): Promise<ElementData> {

		const action = this.getActionByName(data.type);
		if (action) {
            const clone = structuredClone(data);
			return action(clone, this);
		}
		return data;
	}

    async compute(data: ElementData): Promise<ElementData>;
	async compute(data: ElementData[]): Promise<ElementData[]>;
	async compute(data: ElementData | ElementData[]) {
		if (Array.isArray(data)) {
			return Promise.all(data.map(this.computeHelper.bind(this)));
		} else {
			return this.computeHelper(data);
		}
	}

    getRawContent(): ElementData[] {
        return structuredClone(this.page.content);
    }

    getMeta(): Omit<PageFile, "content"> {
        return {
            ...this.page,
            content: undefined
        };
    }
    

    
}