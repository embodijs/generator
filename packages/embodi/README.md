# embodi

Welcome to Embodi, a static website generator based on [Svelte](https://svlete.dev) and [Vite](https://vitejs.dev). Embodi renders your pages for a fast load and hydrates them to a Single Page Application (SPA).

## Quick start

The easiest way to get started is to use the [create-embodi](https://github.com/embodijs/generator/tree/main/packages/create-embodi) package:

```
npm create embodi@latest
```

This will guide you through some steps and create a basic structure.

## Structure

Embodi will read any Markdown file in your project structure and convert it to a page if you set the `layout` property in the front-matter part at the beginning of each file.
The name is a reference to a Svelte file in the `__layout` folder. The component gets the property data, which contain the front-matter data. The rendered markdown part is given into a slot. So each layout should display rendered content needs to have a slot. In layout components you can do everything you normally do with Svelte.

### Public files and images

To store public files like `robots.txt` or images use the `public` folder in the root directory. To change the folder name use the `.embodi.js` file and set the option `publicDir` option. Files in the public directory are referenced without the absolute path e.g. `<root>/public/icon.png` need to be referenced as `/icon.png`

## Build

To build your project, run `npm run build' and `npm run preview' to preview it.
> Do not use `npm run preview` for production.

## Deployment

To deploy, copy the files from `dist/static` and move them to a server such as [nginx](https://nginx.com) or [github pages](https://pages.github.com/). In the future, the template will also include a github action to automatically deploy to github pages.

## Configure Embodi

When using Embodi, everything is preconfigured. The `.embodi.js` file could be just exported with the default config:

```js
// .embodi.js
import { defineConfig } from 'embodi'

export default defineConfig({})
```

### Options

Embodi use [Vite](https://vitejs.dev) under the hood, so most options from vite config should work the same. Official Supported options are listed here:

#### base

- Type: `string`
- Default: `/`
- Reference: [Vite](https://vitejs.dev/config/shared-options.html#base)

Base public path when served in development or production.

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

Location of the Svelte layout files referenced in markdown files with `layout`. Instead of a local reference this could be also a package name.

#### dist

- Type: `string`
- Default: `dist`

Output directory of build sources. Copy the content of the static folder of dist to your server.

#### source

- Type: `string`
- Default: `/`

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
