# Embodi - static site generator

Embodi will help you to build and edit your sites easily. The main elements of embodi are components, client, server, and build actions. All of them could be combined in a plugin.


## config

You need to setup a svletekit project to use embodi. You can use the same comands as in svelte to run or develop the project and you still able to build routes beside embodi routes.

### extend vite config
You need to add embodi to your vite config and register the plugins.
The paths you set for pages and content are needed to load the data. We recomand to put the pages folder inside the content folder, but it is also possible to seperate them.

This in an example from [embodi-content-template](https://github.com/CordlessWool/embodi-content-template/)
```TS
import { sveltekit } from '@sveltejs/kit/vite';
import { embodi } from '@embodi/generator/vite';
import { defineConfig } from 'vitest/config';
import type { EmbodiBuildConfig } from '@embodi/generator/vite/types';

import setupImage from './src/lib/elements/image/build.js';
import setupGroup from './src/lib/elements/group/build.js';
import setupRef from './src/lib/elements/ref/build.js';
import setupLink from './src/lib/elements/item/build.js';
import setupText from './src/lib/elements/text/build.js';
import setupMap from './src/lib/elements/map/build.js';

const embodiConfig: EmbodiBuildConfig = {
	elements: [setupImage('image'), setupGroup('group'), setupRef('ref'), setupLink('link'), setupText('text'), setupMap('map')],
	pagesPath: '../content/pages',
	contentPath: '../content'
};


export default defineConfig({
	plugins: [ embodi(embodiConfig), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./tests/setup-vitest.ts']
	}

});
```

### set routes
Embodi delivers you a complete ready route file, but currently svelte to not allow to insert them outomaticly you need to create them by your own in your routes folder.
For doing this you need to create a `+page.server.ts` / `+page.server.js` and a `+page.svelte` file unter the path `[...slug]`. [EXAMPLE](https://github.com/embodijs/generator/tree/main/src/routes)

```TS
//+pages.sverver.ts
import type { EntryGenerator } from './$types.js';

export const entries = (() => {
    return [
        { slug: '' }
    ];
}) satisfies EntryGenerator;

export * from '@embodi/generator/routes/+page.server';
```

```TS
//+pages.svelte
<script lang="ts" context="module">

    export * from "@embodi/generator/routes/+page.svelte";
    import EmbodiPage from "@embodi/generator/routes/+page.svelte";
</script>

<script lang="ts">
    export * from "@embodi/generator/routes/+page.svelte";
</script>

<EmbodiPage {...$$restProps} />

```




## writing a plugin

A plugin has multiple parts, which need to be registerd in a build setup function, which could be loaded via plugins. Plugins are called elements in embodi

You will find some examples for elements in [embodi-content-template](https://github.com/CordlessWool/embodi-content-template/tree/main/template/src/lib/elements)

Each function you can register will get an helper engine, which offers you some functions to do what you need. You will find definitions of public helper functions [here](https://github.com/embodijs/generator/blob/main/src/lib/exports/types.d.ts) 

### build actions

Build actions are the main entry point where you register all the files and functions you need at runtime to run you element.

In this example regsiters a build action and link a svelte component. You can also register a file with client and server actions that will run at runtime.
> Important: You have to set a file which exports the allowed functions by name for server and client actions and a svelte component file for components. It is not possible to load them in before here, because this script will be run in vite and not all functionality is avalible at this point, but they will be called with the identifier (referenced by the `type` Attribute in ElementData).

```TS
import type { GroupElementData } from './types.js';
import type { BuildHelper, BuildSetupHelper, buildAction } from '@embodi/generator/types';

const action: buildAction<GroupElementData, GroupElementData> = async (
	data: GroupElementData,
	helper: BuildHelper
) => {
	return {
		...data,
		content: await helper.compute(data.content)
	};
};


export default (identifier = 'group') => async (helper: BuildSetupHelper) => {
	helper.registerAction(action, identifier)
	helper.resolveComponent(`${__dirname}/group.svelte`, identifier);
};


export interface BuildHelperBase {
    //load allows loading data from content path
	load(path: imagePath): Promise<Buffer>
	load<T extends JsonMap = JsonMap>(path: jsonFile): Promise<T>
	load(path: string): Promise<unknown>
	storeAsset (content: Buffer, name: string, fileType: string): Promise<string>
}

export interface BuildSetupHelper extends BuildHelperBase {
	registerAction<T extends ElementData, U extends ElementData>(action: buildAction<T,U>, ...identifiers: string[]): void
	resolveComponent(path: string, ...identifiers: string[]): Promise<void>
	resolveServerActions(path: string, ...identifiers: string[]): Promise<void>
	resolveClientActions(path: string, ...identifiers: string[]): Promise<void>
}

```

Build actions are defined by:
```TS
export interface buildAction <T extends ElementData = ElementData, U extends ElementData = T> {
	(data: T, helper: BuildHelper): Promise<U>,
}

export interface BuildHelper extends BuildHelperBase {
	storeAsset (content: Buffer, name: string, fileType: string): Promise<string>
	compute (data: ElementData) : Promise<ElementData>
	compute (data: ElementData[]) : Promise<ElementData[]>
	createEngine(path: string): BuildHelper
}
```

### component

This need to be a regular svlete component which get the data via a `PageFile` (see json file). Data a piped as `data` to the component, so your component needs to export it.

A Component is defined by:
```TS
export interface EmbodiComponentProps<T = ElementData> {
	data: T;
}
```


## json file

All data are stored in JSON file and each page will be a JSON file. Depending on the type of file they have different attraibute, but mainly there are having the same structur.

### PageFile

Each page file need to be discribeable by the following interfache.
`ElementData` will discribe the base structure of you plugin data. The type is the same parameter your registerd your plugins and identifies them.
Put your page files in the pages folder you set in the configuraton and they will automatily read at build time. The `load` function in the sever and build actions are loading data relative to the current readed page file. So you do not have to set paths absolute. [EXAMPLE](https://github.com/CordlessWool/embodi-content-template/tree/main/content/pages)

```TS
interface PageFile {
	type: 'Page',
	title: string,
	slug: string,
	lang: string,
	description?: string,
	author?: string,
	content: ElementData[];
}

export interface ElementData{
	type: string;
	id?: string;
	[x: string]: unknown;
}

```







