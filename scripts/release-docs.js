'use strict';

const {
  releaseVersion,
  releaseChangelog,
} = require('nx/release');
const yargs = require('yargs');
const { chalk, echo } = require('zx');

(async () => {
  const options = await yargs
    .version(false)
    .option('version', {
      description: 'Explicit version specifier to use (e.g., patch, minor, major)',
      type: 'string',
      default: 'prerelease',
    })
    .option('dryRun', {
      description: 'Perform a dry run without making changes',
      type: 'boolean',
      default: false,
    })
    .option('projectName', {
      description:
        'Project name to release',
      type: 'string',
      default: '@calyjs-setup/website'
    })
    .option('verbose', {
      description: 'Enable verbose logging',
      type: 'boolean',
      default: false,
    })
    .parseAsync();

  echo(chalk.white(`
    ##==========================================
    ##
    ##       ${chalk.bold('path: scripts/release-docs.js')}
    ##
    ##     ${chalk.magenta.bold('CalyJS-Setup Docs Release')}
    ##
    ##==========================================\n`));

  try {
    const commonProps = {
      projects: [ options.projectName ],
      firstRelease: true,
      dryRun: options.dryRun,
      verbose: options.verbose,
    };

    echo(`\n${chalk.cyanBright.bold('Releasing documentation site version using NX API')}\n`);

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

    echo(`\n${chalk.bgGreen.bold(' Docs version bump succeeded ')}\n`);

    echo(`\n${chalk.cyanBright.bold('Generating and committing changelog')}\n`);

    await releaseChangelog({
      ...commonProps,
      stageChanges: true,
      version: workspaceVersion,
      versionData: projectsVersionData,
      createRelease: 'github',
      gitCommit: true,
      gitTag: true,
      gitPush: true
    });

    echo(`\n${chalk.bgGreen.bold(' Docs changelog generation succeeded ')}\n`);

    echo(chalk.white(`
      ##==========================================
      ##
      ##       ${chalk.bold('path: scripts/release-docs.js')}
      ##
      ##  ${chalk.magenta.bold('CalyJS-Setup Docs Release Complete')}
      ##
      ##==========================================\n`));
    process.exit(0);
  } catch (err) {
    echo(chalk.redBright.bold(`\n${err}`));
    process.exit(1);
  }
})();
