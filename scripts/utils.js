'use strict';

const { chalk, echo } = require('zx');
const { execSync } = require('child_process');

const banner = (color = 'bgCyan') => chalk[color].bold(' CALYJS ');

function getLatestProjectTag(projectName) {
	try {
		// Get the most recent Git tag for the specified project, sorted by creation date
		// Format is expected to be like: core@1.2.3, utils@0.5.0, etc.
		const tag = execSync(`git tag --list "${projectName}@*" --sort=-creatordate | head -n 1`, {
			encoding: 'utf-8',
		}).trim();

		if (!tag) {
			throw new Error(`No tags found for ${projectName}`);
		}
		echo(banner() + chalk.cyan(` → Found latest tag ${tag}`));
		return tag;
	} catch (err) {
		echo(chalk.yellow(` ⚠ ${err.message}.\n`));
		return null;
	}
}

function getCommitFromTag(tag) {
	return execSync(`git rev-list -n 1 ${tag}`, { encoding: 'utf-8' }).trim();
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
	const headCommit = execSync(`git rev-parse HEAD`).toString().trim();

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
	banner,
};
