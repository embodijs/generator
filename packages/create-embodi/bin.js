#!/usr/bin/env node

import { intro, text, outro } from '@clack/prompts';
import { FilesystemAdapter } from '@loom-io/node-filesystem-adapter';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const adapter = new FilesystemAdapter('/');

intro('Welcome to Embodi!');

const cwdString = await text({
	message: 'How would you like to name your project directory?',
	placeholder: 'my-embodi-website'
});

console.log(cwdString);
console.log(process.cwd());
console.log(fileURLToPath(new URL(`./templates`, import.meta.url).href));

const templateDir = adapter.dir(fileURLToPath(new URL(`./templates`, import.meta.url).href));
const cwd = await adapter.dir(resolve(cwdString));

await cwd.create();

const embodiTemplate = await templateDir.subDir('skeleton');
const listOfEmbodiElements = await embodiTemplate.list();
for(const element of listOfEmbodiElements) {
	await element.copyTo(cwd);
}

const packageJsonTemplate = await cwd.file('package.template.json');
const packageJson = JSON.parse(await packageJsonTemplate.text());
packageJson.name = cwdString;
await cwd.file('package.json').write(JSON.stringify(packageJson, null, 2));
await packageJsonTemplate.delete();










outro(`
Your project directory has been created at ${cwdString}.

To get started, run the following commands:
cd ${cwdString}
npm install
npm run dev

`);