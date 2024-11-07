#!/usr/bin/env node

import { intro, text, outro, isCancel } from "@clack/prompts";
import { FilesystemAdapter } from "@loom-io/node-filesystem-adapter";
import { bold, cyan, grey, yellow } from "kleur/colors";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const adapter = new FilesystemAdapter("/");
const currentDir = await adapter.dir(
  fileURLToPath(new URL(".", import.meta.url)),
);

const { version } = JSON.parse(await currentDir.file("package.json").text());
let cwdString = process.argv[2] || ".";
console.info(`
${grey(`create-embodi version ${version}`)}
`);
intro("Welcome to Embodi!");

if (cwdString === ".") {
  cwdString = await text({
    message: "How would you like to name your project directory?",
    placeholder: "my-embodi-website",
  });

  isCancel(cwdString) && process.exit(1);
}

const templateDir = await currentDir.subDir("templates");
const cwd = await adapter.dir(resolve(cwdString));

if (await cwd.exists()) {
  const force = await confirm({
    message: `Directory ${cwdString} is not empty. Continue anyway?`,
    initialValue: false,
  });

  if (!force) {
    process.exit(1);
  }
} else {
  await cwd.create();
}

const embodiTemplate = await templateDir.subDir("skeleton");
const listOfEmbodiElements = await embodiTemplate.list();
for (const element of listOfEmbodiElements) {
  await element.copyTo(cwd);
}

const packageJsonTemplate = await cwd.file("package.template.json");
const packageJson = JSON.parse(await packageJsonTemplate.text());
packageJson.name = cwdString;
await cwd.file("package.json").write(JSON.stringify(packageJson, null, 2));
await packageJsonTemplate.delete();

outro(`
Your project directory has been created at ${cwdString}.

To get started, run the following commands:
cd ${cwdString}
npm install
npm run dev

`);
