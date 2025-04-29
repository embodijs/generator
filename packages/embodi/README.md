# embodi

> Version 0.11.x and 0.12.x are under development and currently not stable at all. Please keep using version 0.10.x.

Welcome to Embodi, a static website generator based on [Svelte](https://svlete.dev) and [Vite](https://vitejs.dev). Embodi renders your pages for a fast load and hydrates them to a Single Page Application (SPA).

## Quick start

The easiest way to get started is to use the [create-embodi](https://github.com/embodijs/generator/tree/main/packages/create-embodi) package:

```
npm create embodi@latest
```

This will guide you through some steps and create a basic structure.

## Structure

Embodi will read any Markdown or Svelte file the source directory ( default to `<root>/content` directory) in your project structure and convert it to a page. Markdown will only be interpreted as page if they `layout` attribute in front-matter.
The name is a reference to a Svelte file in the `__layout` folder. The component gets the property data, which contain the front-matter data. The rendered markdown part is given into a slot. So each layout should display rendered content needs to have a slot. In layout components you can do everything you normally do with Svelte.

## Data

Embodi offers three ways to provide data to you layout components, the list is in order of priority. All data will only be merged on the first object level.

- Front-matter
- Local data
- Global data

### Front-matter

Front-matter is a block of YAML or JSON at the beginning of a file. It is used to define metadata for the file. The front-matter is separated from the content by three dashes `---`. The front-matter is parsed and passed to the layout component as a property.

### Local data

Local data are stored in the same directory as the markdown file. The data is stored in YAML or JSON files and need to be named `+data.yaml` or `+data.json`. Files in a higher directory will overwrite files in a lower directory.
At least the data will be merged with the front-matter data and may be overwritten.

### Global data

Global data is stored in the `__data` folder in the root directory. The data is stored in YAML or JSON files. The filename is used as the attribute name. The data is merged with the front-matter data and may be overwritten.

## Load actions

Beside the useal content file you can create a script file with the same name e.g. `index.md` and `index.js`, but you could also just use a script file. The script gives you more options to load data or do other actions before rendering the content. The script file should be placed in the same directory as the content file.
Additionally, you can use the `load` function to load data from a remote source. The function is a wrapper around the fetch function and returns the data as JSON.

```ts
// index.js
// This is an example of a load file

import { collections } from '$embodi/collections?locale=de&tag=project';
import type { LoadAction } from 'embodi';

export const load: LoadAction = ({ data }) => {
	const projects = collections.map((project) => {
		return {
			...project.data,
			html: project.html
		};
	});
	return { ...data, projects };
};
```

If you export a `data`, `html`, `Layout` or `Component` property, it will be overwrite the property from the content file.

```ts
export const data = {
	title: 'Hello Embodi'
};
```

## Hooks

Embodi has a hook system to run code before rendering the content. The hook file should be placed in the root directory and named `hooks.js` or `hooks.ts`. The file runs on client and server side, so the code needs to be able to run on both sides.

```ts
// hooks.ts
// This is an example of a hook file with i18next setup
// This file will be executed before rendering the content

import { init, changeLanguage } from 'i18next';
import type { RenderHook } from 'embodi';

export const render: RenderHook = ({ data }) => {
	init({
		fallbackLng: 'en',
		debug: false,
		resources: {
			en: {
				translation: {
					embodi: 'Hello Embodi'
				}
			},
			de: {
				translation: {
					embodi: 'Hallo Embodi'
				}
			}
		}
	});

	changeLanguage(data.locale);
};
```

## Collections

Any file has `tags` attribute in its front-matter with at least one tag ( list is required even with one element ) will be added to a collection. You can access collections in svelte components with importing `$embodi/collections`. This import allows params, to filter, sort or reduce the amount of collections e.g.: `$embodi/collections?only=dogs;cats&limit=3`.

```ts
// Following params are possible
export interface CollectionParams {
	only?: string[]; // ; separated list or only one value possible
	sortBy?: keyof CollectionMeta;
	sortDirection?: 'asc' | 'desc';
	skip?: number; // entries to skip
	limit?: number; // amount of entries
}
export interface CollectionMeta {
	tag: string;
	page: string;
}
```

### Public files and images

To store public files like `robots.txt`, images or css use the `public` folder in the root directory. To change the folder name use the `.embodi.js` file and set the option `publicDir` option. Files in the public directory are referenced without the absolute path e.g. `<root>/public/icon.png` need to be referenced as `/icon.png`

## Build

To build your project, run `npm run build` and `npm run preview` to preview it.

> Do not use `npm run preview` for production.

## Deployment

To deploy, copy the files from `dist/static` and move them to a server such as [nginx](https://nginx.com) or [github pages](https://pages.github.com/). In the future, the template will also include a github action to automatically deploy to github pages.

## Configure Embodi

When using Embodi, everything is preconfigured. The `.embodi.js` file could be just exported with the default config:

```js
// .embodi.js
import { defineConfig } from 'embodi';

export default defineConfig({});
```

### Options

Embodi use [Vite](https://vitejs.dev) under the hood, so most options from vite config should work the same. Official Supported options are listed here:

#### base

- Type: `string`
- Default: `/`
- Reference: [Vite](https://vitejs.dev/config/shared-options.html#base)

Base public path when served in development or production. Needs to start with `/`

#### dataDir

- Type: `string`
- Default `__data`

Relative path to global data files. Folder may contain `yaml` or `json` files, and the filename is used as the attribute name. Data will be merged with front matter data and may be overwritten.

#### publicDir

- Type: `string | false`
- Default: `public`
- Reference: [Vite](https://vitejs.dev/config/shared-options.html#publicDir)

Location for public files.

#### templatePrefix

- Type: `string`
- Default: `./__layout`

Location of the Svelte layout files referenced in markdown files with `layout`.
The path needs to be starting with `./`or `..` otherwise it will be interpreted as module name and will try to load the layout from a template module.

#### dist

- Type: `string`
- Default: `dist`

Output directory of build sources. Copy the content of the static folder of dist to your server.

#### source

- Type: `string`
- Default: `/content`

Source folder to read markdown files from. String have to start `/`

## Support

**Support is welcome!!!** Tell us what you miss, report bugs or open pull requests.

Install dependencies:

```bash
pnpm install
```

Build the library and use it locally in other projects using `watch' mode.

```bash
pnpm run build -- --watch
```

and link to use it in local projects

```bash
pnpm link --global
```
