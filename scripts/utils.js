'use strict';

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
		// Force-fetch all tags from the remote Git repository to ensure we have the latest tags
		execSync('git fetch --tags --force', { stdio: 'inherit' });

		// Get the most recent Git tag for the specified project, sorted by creation date
		// Format is expected to be like: core@1.2.3, utils@0.5.0, etc.
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

module.exports = {
	getLatestTagInfo,
	checkIfRemoteBranchExists,
	banner,
	branchSwitch,
};

getLatestProjectTag('core');
