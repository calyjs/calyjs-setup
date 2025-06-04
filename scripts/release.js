'use strict';

const { releaseVersion, releaseChangelog } = require('nx/release');
const yargs = require('yargs');
const { chalk, echo } = require('zx');
const { banner, branchSwitch, checkIfRemoteBranchExists, getLatestTagInfo } = require('./utils');

async function run() {
	const { dryRun, targetBranch, verbose, specifier, baseBranch, projects } = await yargs
		.version(false)
		.option('specifier', {
			description:
				'Specifier types (e.g., patch, minor, major, prerelease, prepatch, preminor, premajor, rc)',
			type: 'string',
			default: 'patch',
		})
		.option('dryRun', {
			description: 'Run without making changes',
			type: 'boolean',
			default: false,
		})
		.option('targetBranch', {
			description: 'Branch to use for pushing changes',
			type: 'string',
			default: 'release',
		})
		.option('baseBranch', {
			description: 'Base branch to use',
			type: 'string',
			default: 'master',
		})
		.option('verbose', {
			description: 'Enable verbose output',
			type: 'boolean',
			default: false,
		})
		.option('projects', {
			description: 'List of project to be released',
			type: 'array',
			default: [],
		})
		.parseAsync();

	if (projects.length === 0) {
		echo(banner('bgYellow') + chalk.yellow(' ✖ No projects to be released at this moment.'));
		process.exit(1);
	}

	echo(
		chalk.cyanBright(`
    \r ┌──────────────────────────────────────────────────────────────┐
    \r │                                                              │
    \r │   ${chalk.bold.underline('CalyJS Release script')}                               │
    \r │                                                              │
    \r │   ${chalk.gray('Script:')}  ${chalk.white('scripts/release.js')}                           │
    \r │   ${chalk.gray('Purpose:')} ${chalk.white('Automate versioning and changelog generation')}      │
    \r │                                                              │
    \r └──────────────────────────────────────────────────────────────┘
  `)
	);

	echo(
		banner() +
			chalk.cyanBright(` Validate if remote branch `) +
			chalk.magenta.bold(`'${targetBranch}'`) +
			chalk.cyanBright(` exists...\n`)
	);
	const remoteBranchExists = checkIfRemoteBranchExists(targetBranch);
	branchSwitch(remoteBranchExists, targetBranch, baseBranch, dryRun);

	for (const projectName of projects) {
		const { tag, base, head, commits } = getLatestTagInfo(projectName, baseBranch);

		if (!commits || !commits.trim()) {
			echo(
				banner('bgYellow') +
					chalk.yellow(` ⚠ No commits found. Skipping release for '${projectName}' project.\n`)
			);
			continue;
		}

		const commonProps = {
			base,
			head,
			dryRun,
			verbose,
			firstRelease: !tag,
			projects: [projectName],
		};

		try {
			const { projectsVersionData, workspaceVersion } = await releaseVersion({
				...commonProps,
				specifier,
				generatorOptionsOverrides: {
					currentVersionResolver: 'git',
					fallbackCurrentVersionResolver: 'disk',
					specifierSource: 'conventional-commits',
				},
				stageChanges: true,
				gitCommit: true,
				gitCommitArgs: '--no-verify',
				gitCommitMessage: `chore(release): ${projectName} version bump`,
				gitPush: false,
				gitTag: false,
			});

			if (!projectsVersionData[projectName]) {
				throw new Error(`Project "${projectName}" was not processed correctly by releaseVersion.`);
			}

			await releaseChangelog({
				...commonProps,
				version: workspaceVersion,
				versionData: projectsVersionData,
				stageChanges: true,
				gitCommit: true,
				gitCommitArgs: '--no-verify',
				gitTag: true,
				gitPush: true,
				gitCommitMessage: `chore(release): update ${projectName} changelog`,
			});

			echo(
				banner('bgGreen') +
					chalk.greenBright(' ✔ Changelog generated and pushed to ') +
					chalk.magentaBright(`'${targetBranch}'`) +
					chalk.greenBright(' branch.\n')
			);
			echo(banner('bgCyan') + chalk.cyanBright(' Documentation release completed successfully!'));
			echo(
				chalk.cyanBright(`
				\r ${chalk.gray('Branch:')}        ${chalk.greenBright(targetBranch)}
				\r ${chalk.gray('Version:')}       ${chalk.greenBright(projectsVersionData[projectName].newVersion)}
				\r ${chalk.gray('Project:')}       ${chalk.greenBright(projectName)}
				\r ${chalk.gray('Dry Run:')}       ${chalk.greenBright(dryRun ? 'Yes' : 'No')}
				\r ${chalk.gray('Verbose Mode:')}  ${chalk.greenBright(verbose ? 'Enabled' : 'Disabled')}
			`)
			);
		} catch (err) {
			echo(
				banner('bgRed') +
					chalk.red(' ✖ Release script failed with following error →') +
					chalk.cyan.bold(` ${err} \n`)
			);
			process.exit(1);
		}
	}

	process.exit(0);
}

run();
