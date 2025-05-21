'use strict';

const {
  releaseVersion,
  releaseChangelog,
} = require('nx/release');
const yargs = require('yargs');
const { chalk, echo } = require('zx');
const { execSync } = require('child_process');
const DOCS_PROJECT_NAME = 'website';

// Find the latest tag for the `website` project
function getLatestProjectTag(project) {
  try {
    const tag = execSync(
      `git tag --list "${project}@*" --sort=-creatordate | head -n 1`,
      { encoding: 'utf-8' }
    ).trim();
    if (!tag) {
      throw new Error(`No tags found for ${project}`);
    }
    return tag;
  } catch (err) {
    echo(chalk.yellow(`[WARN] Failed to find latest tag for ${project}.`));
    return null;
  }
}

// Get commit hash from a tag
function getCommitFromTag(tag) {
  return execSync(`git rev-list -n 1 ${tag}`, { encoding: 'utf-8' }).trim();
}

(async () => {
  const options = await yargs
    .version(false)
    .option('version', {
      description: 'Version bump type (e.g., patch, minor, major)',
      type: 'string',
      default: 'prerelease',
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
    ┌─────────────────────────────────────────────┐
    │                                             │
    │   📘  ${chalk.bold('CalyJS Docs Release')}                   │
    │   🛠️   ${chalk.gray('Script: scripts/release-docs.js')}      │
    │                                             │
    └─────────────────────────────────────────────┘
  `));

  const {dryRun, targetBranch, verbose, version} = options;

  echo(chalk.gray(`Checking if remote branch '${targetBranch}' exists...\n`));
  let releaseBranchExists = false;

  try {
    const result = execSync(`git ls-remote --heads origin ${targetBranch}`, { encoding: 'utf8' });
    releaseBranchExists = result.includes(`refs/heads/${targetBranch}`);
  } catch {
    releaseBranchExists = false;
  }

  try {
    if (releaseBranchExists) {
      echo(chalk.green(`Remote branch '${targetBranch}' found. Checking out and pulling latest changes...\n`));
      if (dryRun) {
        echo(chalk.yellow(`[dry-run] Would checkout and pull '${targetBranch}' branch.`));
      } else {
        execSync(`git checkout ${targetBranch}`, { stdio: 'inherit' });
        execSync(`git pull origin ${targetBranch}`, { stdio: 'inherit' });
      }
    } else {
      echo(chalk.yellow(`Remote branch '${targetBranch}' not found. Creating new branch...\n`));
      if (dryRun) {
        echo(chalk.yellow(`[dry-run] Would run: git checkout -b ${targetBranch}`));
        echo(chalk.yellow(`[dry-run] Would run: git push --set-upstream origin ${targetBranch}`));
      } else {
        execSync(`git checkout -b ${targetBranch} origin/master`, { stdio: 'inherit' });
        execSync(`git push --set-upstream origin ${targetBranch}`, { stdio: 'inherit' });
      }
    }

    // execSync('git fetch --tags', {stdio: 'inherit'});
    // const latestTag = getLatestProjectTag(DOCS_PROJECT_NAME);
    // const baseCommit = !!latestTag ? getCommitFromTag(latestTag) : execSync('git rev-parse HEAD~1').toString().trim();
    // const headCommit = execSync('git rev-parse HEAD').toString().trim();

    // echo(chalk.gray(`Using base commit: ${baseCommit}`));
    // echo(chalk.gray(`Using head commit: ${headCommit}`));

    // const commits = execSync(`git log --oneline ${baseCommit}..${headCommit}`, {
    //   encoding: 'utf-8'
    // }).trim();

    // if (!commits) {
    //   echo(chalk.yellow(`No commits found  between base(${baseCommit}) and head(${headCommit})`));
    // } else {
    //   echo(chalk.cyanBright(`[INFO] Found commits between base(${baseCommit}) and head(${headCommit}): ${commits}`));
    // }

    const commonProps = {
      firstRelease: false,
      projects: [DOCS_PROJECT_NAME],
      // base: baseCommit,
      // head: headCommit,
      dryRun,
      verbose
    };

    echo(`\n${chalk.bold.cyanBright('Starting version bump using NX release API...')}\n`);

    const { projectsVersionData,  workspaceVersion } = await releaseVersion({
      ...commonProps,
      stageChanges: true,
      specifier: version,
      generatorOptionsOverrides: {
        currentVersionResolver: 'git',
        fallbackCurrentVersionResolver: 'disk',
        specifierSource: 'conventional-commits',
        updateDependents: false,
      },
      gitCommit: false,
      gitTag: false,
    });

    echo(chalk.bgGreen.black(`\n✔️  Version bump complete. New version: ${projectsVersionData[DOCS_PROJECT_NAME].newVersion} \n`));

    echo(`${chalk.bold.cyanBright('Generating changelog and finalizing release...')}\n`);

    await releaseChangelog({
      ...commonProps,
      version: workspaceVersion,
      versionData: projectsVersionData,
      stageChanges: true,
      gitCommit: true,
      gitTag: true,
      gitPush: true,
    });

    echo(chalk.bgGreen.black(`\n✅ Changelog generated and pushed to '${targetBranch}' branch.\n`));

    echo(chalk.cyanBright(`
      \r ${chalk.bold('Documentation release completed successfully!\n')}
      \r   📌 Branch:        ${targetBranch}
      \r   📌 Version:       ${projectsVersionData[DOCS_PROJECT_NAME].newVersion}
      \r   📌 Dry Run:       ${dryRun ? 'Yes' : 'No'}
      \r   📌 Verbose Mode:  ${verbose ? 'Enabled' : 'Disabled'}
    `));

    echo(chalk.gray(`
      \r ─────────────────────────────────────────────
      \r   ✅ Done — docs release process finished.
      \r ─────────────────────────────────────────────\n
    `));
    
    process.exit(0);

  } catch (err) {
    echo(chalk.redBright.bold(`\n❌ Release failed: ${err.message || err}\n`));
    echo(chalk.gray(`Please check the logs above for more details.\n`));
    process.exit(1);
  }
})();
