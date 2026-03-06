#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const VALID_STYLES = new Set(['minimal', 'detailed', 'enterprise']);

function loadCoreModules() {
  try {
    return {
      DirectoryAnalyzer: require('../dist/core/analyzer').DirectoryAnalyzer,
      ReadmeGenerator: require('../dist/core/generator').ReadmeGenerator,
      GitHubFetcher: require('../dist/core/github-fetcher').GitHubFetcher,
      cleanupTempDir: require('../dist/core/utils').cleanupTempDir,
    };
  } catch (error) {
    console.error('\nError: CLI core modules are not built yet.');
    console.error('Run: npm run build:cli\n');
    process.exit(1);
  }
}

const program = new Command();

program
  .name('readme-gen')
  .description('Auto-generate professional README files using AI')
  .version('1.0.0');

program
  .argument('[directory]', 'Directory to analyze', '.')
  .option('-g, --github <url>', 'GitHub repository URL')
  .option('-o, --output <file>', 'Output file path', 'README.md')
  .option('-s, --style <type>', 'README style (minimal|detailed|enterprise)', 'detailed')
  .option('-i, --interactive', 'Interactive mode to customize sections')
  .option('--no-cache', 'Disable caching')
  .action(async (directory, options) => {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;
    const inquirer = (await import('inquirer')).default;
    const { DirectoryAnalyzer, ReadmeGenerator, GitHubFetcher, cleanupTempDir } = loadCoreModules();
    let tempDir = null;

    try {
      console.log(chalk.blue.bold('\n🚀 README Generator AI\n'));

      // Check for API key
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('❌ Error: OPENAI_API_KEY environment variable not set'));
        console.log(chalk.gray('\nSet it with: export OPENAI_API_KEY=your_key_here\n'));
        process.exit(1);
      }

      let targetDir = directory;

      // Handle GitHub URL
      if (options.github) {
        const spinner = ora('Fetching repository from GitHub...').start();
        const fetcher = new GitHubFetcher(process.env.GITHUB_TOKEN);
        const parsed = fetcher.parseGitHubUrl(options.github);
        
        if (!parsed) {
          spinner.fail('Invalid GitHub URL');
          process.exit(1);
        }

        tempDir = await fetcher.fetchRepo(parsed.owner, parsed.repo);
        targetDir = tempDir;
        spinner.succeed(`Repository fetched: ${parsed.owner}/${parsed.repo}`);
      }

      // Analyze directory
      const spinner = ora('Analyzing project structure...').start();
      const analyzer = new DirectoryAnalyzer();
      const analysis = await analyzer.analyze(path.resolve(targetDir));
      spinner.succeed(`Analysis complete: ${analysis.language} project`);

      // Interactive mode
      let readmeOptions = {
        style: options.style,
        sections: {
          badges: true,
          toc: options.style !== 'minimal',
          architecture: options.style === 'enterprise',
          installation: true,
          usage: true,
          api: true,
          env: true,
          structure: options.style !== 'minimal',
          contributing: options.style !== 'minimal',
          license: true,
        },
      };

      if (!VALID_STYLES.has(readmeOptions.style)) {
        console.error(chalk.red(`❌ Invalid style: ${readmeOptions.style}`));
        console.log(chalk.gray('Valid styles: minimal, detailed, enterprise\n'));
        process.exit(1);
      }

      if (options.interactive) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'style',
            message: 'Select README style:',
            choices: ['minimal', 'detailed', 'enterprise'],
            default: options.style,
          },
          {
            type: 'checkbox',
            name: 'sections',
            message: 'Select sections to include:',
            choices: [
              { name: 'Badges', value: 'badges', checked: true },
              { name: 'Table of Contents', value: 'toc', checked: true },
              { name: 'Architecture Diagram', value: 'architecture', checked: true },
              { name: 'Installation', value: 'installation', checked: true },
              { name: 'Usage Examples', value: 'usage', checked: true },
              { name: 'API Reference', value: 'api', checked: true },
              { name: 'Environment Variables', value: 'env', checked: true },
              { name: 'Project Structure', value: 'structure', checked: true },
              { name: 'Contributing Guidelines', value: 'contributing', checked: true },
              { name: 'License', value: 'license', checked: true },
            ],
          },
        ]);

        readmeOptions.style = answers.style;
        readmeOptions.sections = {
          badges: answers.sections.includes('badges'),
          toc: answers.sections.includes('toc'),
          architecture: answers.sections.includes('architecture'),
          installation: answers.sections.includes('installation'),
          usage: answers.sections.includes('usage'),
          api: answers.sections.includes('api'),
          env: answers.sections.includes('env'),
          structure: answers.sections.includes('structure'),
          contributing: answers.sections.includes('contributing'),
          license: answers.sections.includes('license'),
        };
      }

      // Generate README
      const genSpinner = ora('Generating README with AI...').start();
      const generator = new ReadmeGenerator(apiKey, options.cache);
      const readme = await generator.generate(analysis, readmeOptions);
      genSpinner.succeed('README generated successfully');

      // Save to file
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, readme);

      console.log(chalk.green(`\n✅ README saved to: ${outputPath}\n`));
      console.log(chalk.gray('Preview:\n'));
      console.log(readme.split('\n').slice(0, 20).join('\n'));
      console.log(chalk.gray('\n... (truncated)\n'));

    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    } finally {
      // Cleanup temp directory
      if (tempDir) {
        try {
          cleanupTempDir(tempDir);
        } catch (err) {
          console.error(chalk.yellow(`⚠️  Warning: Failed to cleanup temp directory: ${err.message}`));
        }
      }
    }
  });

program.parse();
