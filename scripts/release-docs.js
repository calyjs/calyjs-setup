'use strict';

const { releaseVersion, releaseChangelog } = require('nx/release');
const yargs = require('yargs');
const { chalk, echo } = require('zx');
const { execSync } = require('child_process');

// Script variables
const PROJECT_NAME = 'website';
const ORG_NAME = 'CalyJS';
const WHITE_SPACE = '';

function runOrDryRun(dryRun, command, description) {
	if (dryRun) {
		echo(
			chalk.bgYellow.bold(` ${ORG_NAME.toUpperCase()} `) +
				chalk.yellow(` [dry-run] Would run: ${command}`)
		);
	} else {
		echo(
			chalk.bgGray.bold(` ${ORG_NAME.toUpperCase()} `) + chalk.white(` → Running: ${description}`)
		);
		execSync(command, { stdio: 'inherit' });
	}
}

function getLatestProjectTag(projectName) {
	try {
		execSync('git fetch --tags', { stdio: 'inherit' });
		const tag = execSync(`git tag --list "${projectName}@*" --sort=-creatordate | head -n 1`, {
			encoding: 'utf-8',
		}).trim();
		if (!tag) {
			throw new Error(`No tags found for ${projectName}`);
		}
		return tag;
	} catch (err) {
		echo(chalk.yellow(` ⚠ ${err.message}.\n`));
		return null;
	}
}

function getCommitFromTag(tag) {
	return execSync(`git rev-list -n 1 ${tag}`, { encoding: 'utf-8' }).trim();
}

function checkIfRemoteBranchExists(branchName) {
	try {
		const result = execSync(`git ls-remote --heads origin ${branchName}`, { encoding: 'utf8' });
		return result.includes(`refs/heads/${branchName}`);
	} catch {
		return false;
	}
}

function branchSwitch(branchExists, targetBranch, baseBranch, dryRun) {
	try {
		if (branchExists) {
			echo(
				chalk.bgGreen.bold(` ${ORG_NAME.toUpperCase()} `) +
					chalk.greenBright(' ✔ Remote branch ') +
					chalk.magentaBright.bold(`'${targetBranch}'`) +
					chalk.greenBright(' found.\n')
			);
			runOrDryRun(dryRun, `git checkout ${targetBranch}`, `checkout ${targetBranch}`);
			runOrDryRun(
				dryRun,
				`git pull origin ${targetBranch}`,
				`pull latest changes from ${targetBranch}`
			);
			echo(WHITE_SPACE);
			return;
		}
		echo(
			chalk.bgMagenta.bold(` ${ORG_NAME.toUpperCase()} `) +
				chalk.magenta(' ⚠ Remote branch ') +
				chalk.cyan.bold(`'${targetBranch}'`) +
				chalk.magenta(' not found. Creating new one from ') +
				chalk.cyan.bold(`'${baseBranch}'.\n`)
		);
		runOrDryRun(
			dryRun,
			`git checkout -b ${targetBranch} origin/${baseBranch}`,
			`create and checkout ${targetBranch}`
		);
		runOrDryRun(
			dryRun,
			`git push --set-upstream origin ${targetBranch}`,
			`push ${targetBranch} to origin`
		);
		echo(WHITE_SPACE);
	} catch (err) {
		echo(
			chalk.bgRed.bold(` ${ORG_NAME.toUpperCase()} `) +
				chalk.red(' ✖ Remote branch switch failed with following error →') +
				chalk.cyan.bold(` ${err.message} \n`)
		);
		process.exit(1);
	}
}

async function run(projectName) {
	const { dryRun, targetBranch, verbose, specifier, baseBranch } = await yargs
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
		.parseAsync();

	echo(
		chalk.cyanBright(`
    \r ┌──────────────────────────────────────────────────────────────┐
    \r │                                                              │
    \r │   ${chalk.bold.underline(`${ORG_NAME} Documentation Release`)}                               │
    \r │                                                              │
    \r │   ${chalk.gray('Script:')}  ${chalk.white('scripts/release-docs.js')}                           │
    \r │   ${chalk.gray('Purpose:')} ${chalk.white('Automate versioning and changelog generation')}      │
    \r │   ${chalk.gray('Project:')} ${chalk.white(`apps/${projectName}`)}                                      │
    \r │                                                              │
    \r └──────────────────────────────────────────────────────────────┘
  `)
	);

	echo(
		chalk.bgCyan.bold(` ${ORG_NAME.toUpperCase()} `) +
			chalk.cyanBright(` Validate if remote branch `) +
			chalk.magenta.bold(`'${targetBranch}'`) +
			chalk.cyanBright(` exists...\n`)
	);
	const remoteBranchExists = checkIfRemoteBranchExists(targetBranch);
	branchSwitch(remoteBranchExists, targetBranch, baseBranch, dryRun);

	echo(
		chalk.bgCyan.bold(` ${ORG_NAME.toUpperCase()} `) +
			chalk.cyanBright(` Retrieve latest tag avaiable for project `) +
			chalk.magenta.bold(`'${projectName}'.\n`)
	);

	const latestTag = getLatestProjectTag(projectName);
	const baseCommit = !!latestTag
		? getCommitFromTag(latestTag)
		: execSync('git rev-list --max-parents=0 HEAD').toString().trim();
	const headCommit = execSync('git rev-parse HEAD').toString().trim();

	echo(
		chalk.bgGray.bold(` ${ORG_NAME.toUpperCase()} `) +
			chalk.white(' → Using base commit: ') +
			chalk.cyan.bold(` ${baseCommit}`)
	);
	echo(
		chalk.bgGray.bold(` ${ORG_NAME.toUpperCase()} `) +
			chalk.white(' → Using head commit: ') +
			chalk.cyan.bold(` ${headCommit}`)
	);
	echo(
		chalk.bgGray.bold(` ${ORG_NAME.toUpperCase()} `) +
			chalk.white(' → Commits between HEAD and BASE: \n')
	);
	const commitsBetween = execSync(`git log --oneline ${baseCommit}..${headCommit}`, {
		encoding: 'utf-8',
	});
	if (!commitsBetween) {
		echo(
			chalk.bgYellow.bold(` ${ORG_NAME.toUpperCase()} `) +
				chalk.yellow(' ⚠ No commits found between HEAD and BASE.\n')
		);
	} else {
		echo(`${chalk.magenta(commitsBetween)}`);
	}

	const commonProps = {
		firstRelease: !latestTag,
		projects: [projectName],
		base: baseCommit,
		head: headCommit,
		dryRun,
		verbose,
	};

	echo(
		chalk.bgCyan.bold(` ${ORG_NAME.toUpperCase()} `) +
			chalk.cyanBright(' Starting version bump using NX release API...\n')
	);
	try {
		const { projectsVersionData, workspaceVersion } = await releaseVersion({
			...commonProps,
			specifier,
			generatorOptionsOverrides: {
				currentVersionResolver: 'git',
				fallbackCurrentVersionResolver: 'disk',
				specifierSource: 'conventional-commits',
			},
			stageChanges: false,
			gitCommit: false,
			gitTag: false,
		});

		echo(
			chalk.bgCyan.bold(` ${ORG_NAME.toUpperCase()} `) +
				chalk.cyanBright(' Version bump completed with new version: ') +
				chalk.magenta.bold(`'${projectsVersionData[projectName].newVersion}'\n`)
		);
		echo(
			chalk.bgCyan.bold(` ${ORG_NAME.toUpperCase()} `) +
				chalk.cyanBright(' Generating changelog and finalizing release...\n')
		);

		await releaseChangelog({
			...commonProps,
			version: workspaceVersion,
			versionData: projectsVersionData,
			stageChanges: true,
			gitCommit: true,
			gitTag: true,
			gitPush: true,
			gitCommitMessage: 'chore(release): changelog update',
		});

		echo(
			chalk.bgGreen.bold(` ${ORG_NAME.toUpperCase()} `) +
				chalk.greenBright(' ✔ Changelog generated and pushed to ') +
				chalk.magentaBright(`'${targetBranch}'`) +
				chalk.greenBright(' branch.\n')
		);
		echo(
			chalk.bgCyan.bold(` ${ORG_NAME.toUpperCase()} `) +
				chalk.cyanBright(' Documentation release completed successfully!')
		);
		echo(
			chalk.cyanBright(`
      \r ${chalk.gray('Branch:')}        ${chalk.greenBright(targetBranch)}
      \r ${chalk.gray('Version:')}       ${chalk.greenBright(projectsVersionData[projectName].newVersion)}
      \r ${chalk.gray('Dry Run:')}       ${chalk.greenBright(dryRun ? 'Yes' : 'No')}
      \r ${chalk.gray('Verbose Mode:')}  ${chalk.greenBright(verbose ? 'Enabled' : 'Disabled')}
    `)
		);
		process.exit(0);
	} catch (err) {
		echo(
			chalk.bgRed.bold(` ${ORG_NAME.toUpperCase()} `) +
				chalk.red(' ✖ Release script failed with following error →') +
				chalk.cyan.bold(` ${err.message} \n`)
		);
		process.exit(1);
	}
}

run(PROJECT_NAME);
