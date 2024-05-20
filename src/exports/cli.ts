import minimist from 'minimist';
import { createLogger } from 'vite';
import { createDevServer, createPreviewServer } from './lib.js';
import { generate } from './lib.js';
const argv: any = minimist(process.argv.slice(2));

const logVersion = (logger = createLogger()) => {
  logger.info(`\n Welcome to embodi`, {
    clear: !logger.hasWarned
  })
}

const toDestroy: Array<() => unknown> = [];
const handleExit = (exitCode: number) => {
  console.log('Exiting with code', exitCode);
  toDestroy.map((destroy) => {
    destroy();
  });
}

const command = argv._[0]
const root = argv._[command ? 1 : 0]
if (root) {
  argv.root = root
}

if (command === 'dev') {
  logVersion();
  const server = await createDevServer();
  await server.listen(5173);
  server.printUrls()
  server.bindCLIShortcuts({ print: true })
  toDestroy.push(() => {
    server.close();
    console.log('Server stopped');
  });
}

if (command === 'generate') {
  logVersion();
  await generate();
}

if(command === 'preview') {
  logVersion();
  const server = await createPreviewServer();
  toDestroy.push(() => {
    server.close();
    console.log('Server stopped');
  });
}

process.on('SIGINT', handleExit);
process.on('uncaughtException', handleExit);
process.on('exit', handleExit);
process.on('SIGUSR1', handleExit);
process.on('SIGUSR2', handleExit);
