'use strict';

const { releaseVersion, releaseChangelog } = require('nx/release');
const yargs = require('yargs');
const { chalk, echo } = require('zx');
const { execSync } = require('child_process');

const banner = (color = 'bgCyan') => chalk[color].bold(' CALYJS ');

function runOrDryRun(dryRun, command, description) {
	if (dryRun) {
		echo(banner('bgYellow') + chalk.yellow(` [dry-run] Would run: ${command}`));
	} else {
		echo(banner('bgGray') + chalk.white(` → Running: ${description}`));
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
				banner('bgGreen') +
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
			return;
		}
		echo(
			banner('bgMagenta') +
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
	} catch (err) {
		echo(
			banner('bgRed') +
				chalk.red(' ✖ Remote branch switch failed with following error →') +
				chalk.cyan.bold(` ${err.message} \n`)
		);
		process.exit(1);
	}
}

function getLatestTagInfo(projectName) {
	echo(
		banner() +
			chalk.cyanBright(` Retrieve latest tag avaiable for project `) +
			chalk.magenta.bold(`'${projectName}'.\n`)
	);

	const latestTag = getLatestProjectTag(projectName);
	const baseCommit = !!latestTag
		? getCommitFromTag(latestTag)
		: execSync('git rev-list --max-parents=0 HEAD').toString().trim();
	const headCommit = execSync('git rev-parse HEAD').toString().trim();

	echo(
		banner('bgGray') + chalk.white(' → Using base commit: ') + chalk.cyan.bold(` ${baseCommit}`)
	);
	echo(
		banner('bgGray') + chalk.white(' → Using head commit: ') + chalk.cyan.bold(` ${headCommit}\n`)
	);

	const commitsBetween = execSync(`git log --oneline ${baseCommit}..${headCommit}`, {
		encoding: 'utf-8',
	});

	return {
		tag: latestTag,
		base: baseCommit,
		head: headCommit,
		commits: commitsBetween,
	};
}

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
		process.exit(0);
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
		const { tag, base, head, commits } = getLatestTagInfo(projectName);

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
				gitCommitMessage: `chore(release): update version for ${projectName} project`,
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
				gitTag: true,
				gitPush: true,
				gitCommitMessage: `chore(release): changelog update for ${projectName} project`,
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
