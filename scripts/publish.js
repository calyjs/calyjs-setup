'use strict';

const { releasePublish } = require('nx/release');
const yargs = require('yargs');
const { chalk, echo } = require('zx');
const { banner, getLatestTagInfo } = require('./utils');

async function run() {
	const { dryRun, tag, verbose } = await yargs
		.option('dryRun', {
			description: 'Whether or not to perform a dry-run of the release process, defaults to true',
			type: 'boolean',
			default: false,
		})
		.option('tag', {
			description: 'This value matches the tag name shown on GitHub.',
			type: 'string',
			default: null,
		})
		.option('verbose', {
			description: 'Whether or not to enable verbose logging, defaults to false',
			type: 'boolean',
			default: false,
		})
		.parseAsync();

	echo(
		chalk.cyanBright(`
    \r ┌──────────────────────────────────────────────────────────────┐
    \r │                                                              │
    \r │   ${chalk.bold.underline('CalyJS Publish script')}                                      │
    \r │                                                              │
    \r │   ${chalk.gray('Script:')}  ${chalk.white('scripts/publish.js')}                                │
    \r │   ${chalk.gray('Purpose:')} ${chalk.white('Automate NPM publish task')}                         │
    \r │                                                              │
    \r └──────────────────────────────────────────────────────────────┘
  `)
	);

	const match = tag?.match(/^(.*?)@.*$/i);
	const projectName = match?.[1];

	if (!projectName) {
		echo(
			banner('bgRed') +
				chalk.red(` ✖ Invalid tag name expression: ${tag} →`) +
				chalk.cyan.bold(` Expected pattern: ${chalk.bgCyan.bold(' <project>@<semver> ')}. \n`)
		);
		process.exit(1);
	}

	const { tag: latestTag } = getLatestTagInfo(projectName);

	try {
		const publishStatus = await releasePublish({
			dryRun,
			verbose,
			projects: [projectName],
			firstRelease: !latestTag,
			tag: 'latest',
		});

		const code = publishStatus?.[projectName]?.code ?? 1;

		if (code === 1) {
			throw Error(`NPM publish script failed for '${projectName}'`);
		}

		echo(
			banner('bgGreen') +
				chalk.greenBright(' ✔ Package ') +
				chalk.magentaBright(`'${tag}'`) +
				chalk.greenBright(' successfully published to NPM !!!\n')
		);

		process.exit(code);
	} catch (err) {
		echo(
			banner('bgRed') +
				chalk.red(' ✖ Publish script failed with following error →') +
				chalk.cyan.bold(` ${err} \n`)
		);
		process.exit(1);
	}
}

run();
