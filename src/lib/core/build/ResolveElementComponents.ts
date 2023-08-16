import type { Plugin } from "vite";
import BuildEngine from "./BuildEngine.js";
import { dirname, resolve } from "node:path";

export default class ResolveElementComponents {

    protected modulePaths: Set<string>;

    constructor() {
        this.modulePaths = new Set<string>([BuildEngine.importer]);
    }

    async partOfElement(source: string, importer: string | undefined): Promise<boolean> {
		if(importer == null || !this.modulePaths.has(importer)) {
			return false;
		}

		if(source.endsWith('.svelte')) {
			BuildEngine.includeComponent(resolve(dirname(importer), source));
		} else {
			this.modulePaths.add(source);
		}
		return true;
	}
}
  