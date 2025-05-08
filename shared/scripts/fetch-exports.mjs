#!/usr/bin/env node
'use strict';

import * as process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chalk, echo, fs, path } from 'zx';

async function validateExports(exports, rootPath) {
	// Fetch misssing export files
	const missingFiles = await Promise.all(
		Object.values(exports).map((xport) => {
			if (typeof xport === 'string') return [];

			return Promise.all([
				fs.exists(xport.default),
				fs.exists(xport.module),
				fs.exists(xport.types),
			]).then(([main, module, types]) =>
				[
					!main && path.relative(rootPath, xport.default),
					!module && path.relative(rootPath, xport.module),
					!types && path.relative(rootPath, xport.types),
				].filter((value) => Boolean(value))
			);
		})
	).then((files) => files.flat());

	// Exit with error if missing files exist.
	if (missingFiles.length > 0) {
		echo(`
      \r${chalk.cyanBright.bold('Missing files:')}
      
      \r\t${chalk.magenta.bold('[ ')}${chalk.greenBright(missingFiles.join(',\v\r\t  '))}${chalk.magenta.bold(' ]')}

      \r${chalk.redBright.bold('Script failed. Did you forget to build?')}
      
      \rBuild project from the root directory and try ${chalk.bgYellowBright.bold(' npm run prepack ')} again.
    `);
		process.exit(1);
	}

	echo(chalk.greenBright.bold('\n¡¡¡ Export files succesfully fetched !!!'));
}

(async () => {
	echo(
		chalk.white(`
    \r##==========================================
    \r##
    \r##  ${chalk.bold('path: config/scripts/fetch-exports.mjs')}
    \r##
    \r##  ${chalk.magenta.bold('Fetch Exports: Validate package exports')}
    \r##
    \r##==========================================`)
	);

	// Get project package "exports" section
	const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
	const { exports } = await fs.readJSON('./package.json');

	// Exit script with no error, if no exports
	if (!exports) process.exit(0);

	// Validate presence of export files
	await validateExports(exports, rootPath);

	// Copying files to specified path (except for root path)
	for (const [key, xport] of Object.entries(exports)) {
		if (path.extname(key) || typeof xport === 'string' || key === '.') continue;
		const { default: main, module, types } = xport;
		await fs.mkdirp(key);
		await Promise.all([
			fs.copyFile(main, `${key}/${path.basename(main)}`),
			fs.copyFile(module, `${key}/${path.basename(module)}`),
			fs.copyFile(types, `${key}/${path.basename(types)}`),
			fs.writeJson(
				`${key}/package.json`,
				{
					sideEffects: false,
					main: path.basename(main),
					module: path.basename(module),
					types: path.basename(types),
				},
				{ spaces: 2 }
			),
		]);
	}

	echo(
		chalk.white(`
    \r##==========================================
    \r##
    \r##      ${chalk.magenta.bold('Fetch Exports: End of Script')}
    \r##
    \r##==========================================`)
	);
	process.exit(0);
})();
