# embodi

Welcome to Embodi, a static website generator based on [Svelte](https://svlete.dev) and [Vite](https://vitejs.dev). Embodi renders your pages for a fast load and hydrates them to a Single Page Application (SPA).

## Quick start

The easiest way to get started is to use the [create-embodi](https://github.com/embodijs/generator/tree/main/packages/create-embodi) package:

```
npm create embodi@latest
```

This will guide you through some steps and create a basic structure.

## Structure

Embodi will read any Markdown file in your project structure and convert it to a page if you set the `layout` property in the data part at the beginning of each file.
The name is a reference to a Svelte file in the `__layout` folder. The called layout component is given two parameters:
- `data` is the front-matter part of your markdown file, converted to json.
- `content` is the HTML rendered Markdown.
In layout components you can do everything you normally do with Svelte.

## Build

To build your project, run `npm run build' and `npm run preview' to preview it.
> Do not use `npm run preview` for production.

## Deployment

To deploy, copy the files from `dist/static` and move them to a server such as [nginx](https://nginx.com) or [github pages](https://pages.github.com/). In the future, the template will also include a github action to automatically deploy to github pages.


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


