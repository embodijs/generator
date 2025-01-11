#!/usr/bin/env node

import { intro, text, outro, isCancel, confirm } from "@clack/prompts";
import * as fs from "@loom-io/fs-sync";
import { pipe, run } from "pipe-and-combine";
import { bold, cyan, grey, yellow } from "kleur/colors";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = fs.dir(fileURLToPath(new URL(".", import.meta.url)));
const { version } = run(
  fs.resolveTo(currentDir),
  fs.goto(fs.file("package.json")),
  fs.readFile("utf-8"),
  fs.json.getContent()
);

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
//const templateDir = await currentDir.subDir("templates");
const cwd = run(fs.resolveTo(currentDir), fs.goto(fs.dir(cwdString)));
if (run(() => cwd, fs.exists())) {
  const force = await confirm({
    message: `Directory ${cwdString} is not empty. Continue anyway?`,
    initialValue: false,
  });

  if (!force) {
    process.exit(1);
  }
} else {
  run(() => cwd, fs.create(true));
}

run(
  fs.resolveTo(currentDir),
  fs.goto("templates/skeleton"),
  fs.copyDirContent(cwd)
);

run(
  fs.resolveTo(cwd),
  fs.goto("package.template.json"),
  fs.readFile("utf-8"),
  fs.json.update((json) => ({
    ...json,
    name: cwdString,
  })),
  fs.writeFile("utf-8"),
  fs.renameFile("package.json")
);

outro(`
Your project directory has been created at ${cwdString}.

To get started, run the following commands:
cd ${cwdString}
npm install
npm run dev

`);
