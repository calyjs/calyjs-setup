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
    console.warn(`[WARN] Failed to find latest tag for ${project}.`);
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

  const branchName = options.targetBranch;
  const isDryRun = options.dryRun;
  const isVerbose = options.verbose;

  echo(chalk.gray(`Checking if remote branch '${branchName}' exists...\n`));
  let releaseBranchExists = false;

  try {
    const result = execSync(`git ls-remote --heads origin ${branchName}`, { encoding: 'utf8' });
    releaseBranchExists = result.includes(`refs/heads/${branchName}`);
  } catch {
    releaseBranchExists = false;
  }

  try {
    if (releaseBranchExists) {
      echo(chalk.green(`Remote branch '${branchName}' found. Checking out and pulling latest changes...\n`));
      if (isDryRun) {
        echo(chalk.yellow(`[dry-run] Would checkout and pull '${branchName}' branch.`));
      } else {
        execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
        execSync(`git pull origin ${branchName}`, { stdio: 'inherit' });
      }
    } else {
      echo(chalk.yellow(`Remote branch '${branchName}' not found. Creating new branch...\n`));
      if (isDryRun) {
        echo(chalk.yellow(`[dry-run] Would run: git checkout -b ${branchName}`));
        echo(chalk.yellow(`[dry-run] Would run: git push --set-upstream origin ${branchName}`));
      } else {
        execSync(`git checkout -b ${branchName} origin/master`, { stdio: 'inherit' });
        execSync(`git push --set-upstream origin ${branchName}`, { stdio: 'inherit' });
      }
    }

    const latestTag = getLatestProjectTag(DOCS_PROJECT_NAME);
    const baseCommit = !!latestTag ? getCommitFromTag(latestTag) : execSync('git rev-parse HEAD~1').toString().trim();
    const headCommit = execSync('git rev-parse HEAD').toString().trim();

    echo(chalk.gray(`Using base commit: ${baseCommit}`));
    echo(chalk.gray(`Using head commit: ${headCommit}`));

    const commonProps = {
      firstRelease: !!latestTag,
      projects: [DOCS_PROJECT_NAME],
      dryRun: isDryRun,
      verbose: isVerbose,
      base: baseCommit,
      head: headCommit,
    };

    echo(`\n${chalk.bold.cyanBright('Starting version bump using NX release API...')}\n`);

    const { projectsVersionData, workspaceVersion } = await releaseVersion({
      ...commonProps,
      stageChanges: true,
      specifier: options.version,
      generatorOptionsOverrides: {
        currentVersionResolver: 'git',
        fallbackCurrentVersionResolver: 'disk',
        specifierSource: 'conventional-commits',
        updateDependents: false,
      },
      gitCommit: false,
      gitTag: false,
    });

    echo(chalk.bgGreen.black(`\n✔️  Version bump complete. New version: ${workspaceVersion} \n`));

    echo(`${chalk.bold.cyanBright('Generating changelog and finalizing release...')}\n`);

    await releaseChangelog({
      ...commonProps,
      stageChanges: true,
      version: workspaceVersion,
      versionData: projectsVersionData,
      createRelease: 'github',
      gitCommit: true,
      gitTag: true,
      gitPush: true,
    });

    echo(chalk.bgGreen.black(`\n✅ Changelog generated and pushed to '${branchName}' branch.\n`));

    echo(chalk.cyanBright(`
      \r ${chalk.bold('Documentation release completed successfully!\n')}
      \r   📌 Branch:        ${branchName}
      \r   📌 Version:       ${workspaceVersion}
      \r   📌 Dry Run:       ${isDryRun ? 'Yes' : 'No'}
      \r   📌 Verbose Mode:  ${isVerbose ? 'Enabled' : 'Disabled'}
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
