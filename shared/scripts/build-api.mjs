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
			description: 'TypeScript build configuration file.',
			type: 'string',
			default: './tsconfig.json',
		})
		.option('aeConfig', {
			alias: 'aec',
			description: 'API Extractor configuration file.',
			type: 'string',
			default: './api-extractor.json',
		})
		.parseAsync();

	// Get file paths
	const tscPaths = await glob(args.tsConfig);
	const aecPaths = await glob(args.aeConfig);

	echo(
		chalk.white(`
    \r##==========================================
    \r##
    \r##    ${chalk.bold('path: config/scripts/build-api.mjs')}
    \r##
    \r##    ${chalk.magenta.bold('API Extractor: Configuration Setup')}
    \r##
    \r##==========================================`)
	);

	echo(
		chalk.cyan(`\vTS Configuration${tscPaths.length > 1 ? 's' : ''}:
    \t${chalk.magenta.bold('[ ')}${chalk.greenBright(tscPaths.join(',\v\r\t  '))}${chalk.magenta.bold(' ]')}`)
	);

	echo(
		chalk.cyan(`\vAPI Extractor configuration${aecPaths.length > 1 ? 's' : ''}:
    \t${chalk.magenta.bold('[ ')}${chalk.greenBright(aecPaths.join(chalk.gray(',\v\r\t  ')))}${chalk.magenta.bold(' ]')}`)
	);

	echo(
		chalk.white(`
    \r##==========================================
    \r##
    \r##      ${chalk.magenta.bold('API Extractor: Generate Files')}
    \r##
    \r##==========================================`)
	);

	echo(
		chalk.cyan(`\v\rBuilding TS${tscPaths.length > 1 ? "'s" : ''}:
    \r\t${chalk.magenta.bold('[ ')}${chalk.greenBright(tscPaths.join(',\v\r\t  '))}${chalk.magenta.bold(' ]')}`)
	);

	// Exec TypeScript build for each tsconfig file
	await Promise.all(tscPaths.map((tscPath) => $`npx tsc -b ${tscPath}`)).catch((err) => {
		echo(chalk.redBright.bold(`\n${err}`));
		process.exit(1);
	});

	echo(
		chalk.cyan(`\v\rRunning API Extractor${aecPaths.length > 1 ? 's' : ''}:
    \r\t${chalk.magenta.bold('[ ')}${chalk.greenBright(aecPaths.join(chalk.gray(',\v\r\t  ')))}${chalk.magenta.bold(' ]')}`)
	);

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
				echo(
					chalk.cyan(
						`\v\rCreating file ${chalk.greenBright(mdtsPath)} out of ${chalk.greenBright(path)}`
					)
				);
				await fs.copyFile(path, mdtsPath);
			}
		})
	).catch(() => {
		process.exit(1);
	});

	echo(
		chalk.white(`
    \r##==========================================
    \r##
    \r##      ${chalk.magenta.bold('API Extractor: End of Script')}
    \r##
    \r##==========================================
  `)
	);
	process.exit(0);
})();
