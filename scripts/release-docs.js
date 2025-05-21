'use strict';

const {
  releaseVersion,
  releaseChangelog,
} = require('nx/release');
const yargs = require('yargs');
const { chalk, echo } = require('zx');
const { execSync } = require('child_process');

function runOrDryRun(dryRun, command, description) {
  if (dryRun) {
    echo(chalk.yellow(`[dry-run] Would run: ${command}`));
  } else {
    echo(chalk.gray(`→ Running: ${description}`));
    execSync(command, { stdio: 'inherit' });
  }
}

function getLatestProjectTag(projectName) {
  try {
    execSync('git fetch --tags', {stdio: 'inherit'});
    const tag = execSync(
      `git tag --list "${projectName}@*" --sort=-creatordate | head -n 1`,
      { encoding: 'utf-8' }
    ).trim();
    if (!tag) {
      throw new Error(`No tags found for ${projectName}`);
    }
    return tag;
  } catch (err) {
    echo(chalk.yellow(`[WARN] ${err.message}.\n`));
    return null;
  }
}

function getCommitFromTag(tag) {
  return execSync(`git rev-list -n 1 ${tag}`, { encoding: 'utf-8' }).trim();
}

function checkIfRemoteBranchExists(branchName) {
  echo(chalk.gray(`Checking if remote branch '${branchName}' exists...\n`));
  try {
    const result = execSync(`git ls-remote --heads origin ${branchName}`, { encoding: 'utf8' });
    return result.includes(`refs/heads/${branchName}`);
  } catch {
    return false;
  }
}

function branchSwitch(branchExists, branchName, dryRun) {
  try {
    if (branchExists) {
      echo(chalk.green(`✔ Remote branch '${branchName}' found.\n`));
      runOrDryRun(dryRun, `git checkout ${branchName}`, `checkout ${branchName}`);
      runOrDryRun(dryRun, `git pull origin ${branchName}`, `pull latest changes from ${branchName}`);
      echo('\n');
      return;
    }
    echo(chalk.magenta(`⚠ Remote branch '${branchName}' not found. Creating new one from origin/master.\n`));
    runOrDryRun(dryRun, `git checkout -b ${branchName} origin/master`, `create and checkout ${branchName}`);
    runOrDryRun(dryRun, `git push --set-upstream origin ${branchName}`, `push ${branchName} to origin`);
    echo('\n');
  } catch (err) {
    echo(chalk.redBright.bold(`\n✖ Branch switch failed with following error:`));
    echo('  ' + chalk.bgRedBright.black(` ${err.message} \n`));
  }
}

async function run(projectName) {
  const {dryRun, targetBranch, verbose, specifier} = await yargs.version(false)
  .option('specifier', {
    description: 'Specifier types (e.g., patch, minor, major, prerelease, prepatch, preminor, premajor, rc)',
    type: 'string',
    default: 'patch',
  })
  .option('dryRun', {
    description: 'Run without making changes',
    type: 'boolean',
    default: false,
  })
  .option('targetBranch', {
    description: 'Run without making changes',
    type: 'string',
    default: 'release',
  })
  .option('verbose', {
    description: 'Enable verbose output',
    type: 'boolean',
    default: false,
  })
  .parseAsync();
  
  echo(chalk.cyanBright(`
    \r ┌──────────────────────────────────────────────────────────────┐
    \r │                                                              │
    \r │   ${chalk.bold.underline('CalyJS Documentation Release')}                               │
    \r │                                                              │
    \r │   ${chalk.gray('Script:')}  ${chalk.white('scripts/release-docs.js')}                           │
    \r │   ${chalk.gray('Purpose:')} ${chalk.white('Automate versioning and changelog generation')}      │
    \r │   ${chalk.gray('Project:')} ${chalk.white(`apps/${projectName}`)}                                      │
    \r │                                                              │
    \r └──────────────────────────────────────────────────────────────┘
  `));

  const remoteBranchExists = checkIfRemoteBranchExists(targetBranch);
  branchSwitch(remoteBranchExists, targetBranch, dryRun);
  const latestTag = getLatestProjectTag(projectName);
  const baseCommit = !!latestTag ? getCommitFromTag(latestTag) : execSync('git rev-parse HEAD~1').toString().trim();
  const headCommit = execSync('git rev-parse HEAD').toString().trim();

  const commonProps = {
    firstRelease: !latestTag,
    projects: [projectName],
    base: baseCommit,
    head: headCommit,
    dryRun,
    verbose
  };

  echo(`${chalk.bold.cyanBright('Starting version bump using NX release API...')}\n`);
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

    echo(chalk.bgGreen.black(` Version bump complete. New version: ${projectsVersionData[projectName].newVersion} \n`));
    echo(`${chalk.bold.cyanBright('Generating changelog and finalizing release...')}\n`);

    await releaseChangelog({
      ...commonProps,
      version: workspaceVersion,
      versionData: projectsVersionData,
      stageChanges: true,
      gitCommit: true,
      gitTag: true,
      gitPush: true,
      gitCommitMessage: 'chore(release): changelog update'
    });

    echo(chalk.bgGreen.black(` Changelog generated and pushed to '${targetBranch}' branch. \n`));
    echo(chalk.cyanBright(`
      \r${chalk.bold('Documentation release completed successfully!\n')}
      \r   ${chalk.gray('Branch:')}        ${chalk.greenBright(targetBranch)}
      \r   ${chalk.gray('Version:')}       ${chalk.greenBright(projectsVersionData[projectName].newVersion)}
      \r   ${chalk.gray('Dry Run:')}       ${chalk.greenBright(dryRun ? 'Yes' : 'No')}
      \r   ${chalk.gray('Verbose Mode:')}  ${chalk.greenBright(verbose ? 'Enabled' : 'Disabled')}
    `));
    process.exit(0);
  } catch(err) {
    echo(chalk.redBright.bold(`\n✖ Release script failed with following error:`));
    echo('  ' + chalk.bgRedBright.black(` ${err.message} \n`));
    process.exit(1);
  }
}

run('website');