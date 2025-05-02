#!/usr/bin/env node
'use strict';

import * as process from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { $, chalk, echo, fs } from 'zx';
import { glob } from 'glob';

(async () => {
  // Pull arguments with default values
  const args = await yargs(hideBin(process.argv))
  .version(false)
  .option('tsConfig', {
    alias: 'tsc',
    description:
      'TypeScript build configuration file.',
    type: 'string',
    default: './tsconfig.json'
  })
  .option('aeConfig', {
    alias: 'aec',
    description:
      'API Extractor configuration file.',
    type: 'string',
    default: './api-extractor.json'
  })
  .parseAsync();

  // Get file paths
  const tscPaths = await glob(args.tsConfig);
  const aecPaths = await glob(args.aeConfig);
  const divider = chalk.white('\n' + '='.repeat(50));

  echo(chalk.white(`
    ${divider}
    \r##    ${chalk.white.bold('Path:')} ${chalk.gray('config/scripts/build-api.mjs')}
    \r##    ${chalk.magenta.bold('API Extractor:')} ${chalk.white('Configuration Setup')}
    ${divider}
  `));

  echo(chalk.cyan.bold(`TypeScript Configuration${tscPaths.length > 1 ? 's' : ''}:`));
  echo(chalk.magenta('  [ ') + chalk.greenBright(tscPaths.join(`,\n    `)) + chalk.magenta(' ]\n'));

  echo(chalk.cyan.bold(`API Extractor Configuration${aecPaths.length > 1 ? 's' : ''}:`));
  echo(chalk.magenta('  [ ') + chalk.greenBright(aecPaths.join(`,\n    `)) + chalk.magenta(' ]\n'));

  echo(`
    ${divider}
    ${chalk.magenta.bold('API Extractor:')} ${chalk.white('Generate Files')}
    ${divider}
  `);

  echo(chalk.cyan.bold(`Building TypeScript${tscPaths.length > 1 ? ' Projects' : ''}:`));
  echo(chalk.magenta('  [ ') + chalk.greenBright(tscPaths.join(`,\n    `)) + chalk.magenta(' ]\n'));
  
  // Exec TypeScript build for each tsconfig file
  await Promise.all(tscPaths.map((tscPath) => $`npx tsc -b ${tscPath}`)).catch((err) => {
    echo(chalk.redBright.bold(`\n${err}`));
    process.exit(1);
  });;

  echo(chalk.cyan.bold(`Running API Extractor${aecPaths.length > 1 ? 's' : ''}:`));
  echo(chalk.magenta('  [ ') + chalk.greenBright(aecPaths.join(',\n    ')) + chalk.magenta(' ]\n'));

  // Exec API Extractor command for each config file
  await Promise.all(
    aecPaths.map(async (aecPath) => {
      await $`npx api-extractor run --local --verbose -c ${aecPath}`;
      const configFile = await fs.readJson(aecPath);
      const filePath = configFile.dtsRollup?.untrimmedFilePath;
      if (filePath) {
        const path = filePath.replace('<projectFolder>', configFile.projectFolder ?? '.');
        echo(chalk.cyan(`\v\rCreating file ${chalk.greenBright(path)}`));
        const dtsFile = await fs.readFile(path, 'utf-8');
        await fs.writeFile(path, dtsFile);
        const mdtsPath = path.replace(/\.d\.ts$/, '.d.mts');
        echo(chalk.cyan(`\v\rCreating file ${chalk.greenBright(mdtsPath)} out of ${chalk.greenBright(path)}`));
        await fs.copyFile(path, mdtsPath);
      }
    }),
  ).catch(() => {
    process.exit(1);
  });

  echo(chalk.white(`
    ${divider}
    \r##    ${chalk.magenta.bold('API Extractor:')} ${chalk.white('End of Script')}
    ${divider}
  `));
  process.exit(0);
})();