# Embodi - static site generator

Embodi will assist you in easily creating and modifying the content for your static website. You can insert your own plugins or load them from the web. These Elements come in various types including actions and components.

- `buildSetupAction` is the entry point to your own Element and registers all other parts.
- `buildAction' can be registered in the build setup action with `helper.registerAction' and will be called when the content is rendered. This allows, for example, to register files as assets in the PageFile.
- `ServerActions` must be exported by a file that can be registered in the build setup with `helper.resolveServerActions'.
- `ClientActions` need to be browser compatible because they are called on server side rendering or client side rendering. Same as `ServerActions` you need a file that exports them to register the file with `helper.resolveClientActions`.
- `EmbodiComponent` are the most important part, because they give your site the beauty it deserves. Components need to be written in svelte and could be added with `helper.resolveComponents`.

At minimum, you can add components that are registered in the build setup action. Currently, you need to write the JSON describing your page yourself, but we are working on an editing tool to make it more user-friendly.

So, the goal of Embodi is to provide you with an easy way to create and edit your own website, as well as the ability to create custom elements. This gives you complete control over the design of your site.

You will find types and interfaces in [src/lib/exports/types.d.ts](https://github.com/embodijs/generator/blob/main/src/lib/exports/types.d.ts)

## Config

To use Embodi, you need to set up a SvelteKit project. You can use the same commands as in SvelteKit to run or develop the project, and you can still build routes in addition to Embodi routes.

### Extend Vite Config

You need to add Embodi to your Vite config and register the plugins. The paths you set for pages and content are necessary to load the data. We recommend placing the pages folder within the content folder, although it is also feasible to separate them.

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

### Setting up Embodi routes

Embodi delivers you a complete ready routes file, but currently svelte to not allow to insert them outomatic, you need to create them by yourself in your routes folder. You need to create a `+page.server.ts` / `+page.server.js` and a `+page.svelte` file under the path `[...slug]` and insert the following code. [EXAMPLE](https://github.com/embodijs/generator/tree/main/src/routes)

```TS
//[...slug]/+pages.sverver.ts
import type { EntryGenerator } from './$types.js';

export const entries = (() => {
    return [
        { slug: '' }
    ];
}) satisfies EntryGenerator;

export * from '@embodi/generator/routes/+page.server';
```

```TS
//[...slug]/+pages.svelte
<script lang="ts" context="module">

    export * from "@embodi/generator/routes/+page.svelte";
    import EmbodiPage from "@embodi/generator/routes/+page.svelte";
</script>

<script lang="ts">
    export * from "@embodi/generator/routes/+page.svelte";
</script>

<EmbodiPage {...$$restProps} />

```

## Writing an Element

A plugin has multiple parts that must be registered in a build setup function to load it.

You can find some examples of elements in [embodi-content-template](https://github.com/CordlessWool/embodi-content-template/tree/main/template/src/lib/elements)

Each function that you can register gets a helper engine that provides you with some features to make your life easier. You can find definitions of public helper functions [here](https://github.com/embodijs/generator/blob/main/src/lib/exports/types.d.ts)

### Build Actions

Build actions are the main entry point where you register all the files and functions you need to run your item at runtime.

The following example registers a build action and associates a lightweight component. You can also register a file with client and server actions that run at runtime.
> Important: You must specify a file that exports the allowed functions by name for server and client actions, and a svelte component file for components. It is not possible to load them beforehand because this script is run in vite and not all functionality is avaliable at this point, but they will be called with the identifier (referenced by the `type` attribute in ElementData).

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

### EmbodiComponent

This must be a regular svlete component that gets the data via a `PageFile` (see json file). Data is piped as `data` to the component, so your component needs to export it.

A component is defined by
```TS
export interface EmbodiComponentProps<T = ElementData> {
	data: T;
	engine?: ClientHelper;
}

export type EmbodiComponent<T = ElementData> = typeof SvelteComponent<EmbodiComponentProps<T>>
```


## JSON files

All data is stored in JSON files, with each page being a separate JSON file. Different file types have different attributes, but all generally follow the same structure.

### Page Files

Each page file needs to adhere to the following interface.
The "ElementData" describes the base structure of your plugin data. The type parameter should be the same as the one with which you registered your plugins to identify them. Put your page files in the pages folder that you have specified in the configuration, and they will be automatically read during the build time. The `load` function in the server and build actions reads data relative to the currently read page file, so you do not need to set absolute paths. Check out this [example](https://github.com/CordlessWool/embodi-content-template/tree/main/content/pages).

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







