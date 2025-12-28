#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const envModule = require('./modules/env');
const authModule = require('./modules/auth');
const apiModule = require('./modules/api');
const projectModule = require('./modules/project');
const securityModule = require('./modules/security');
const dependenciesModule = require('./modules/dependencies');
const databaseModule = require('./modules/database');
const reportModule = require('./modules/report');
const { generateFixes } = require('./utils/fixHelpers');

program
  .name('ready-to-ship')
  .description('Validate a backend project before deployment like a senior engineer would')
  .version('1.0.0');

program
  .command('env')
  .description('Validate .env and env usage')
  .option('-p, --path <path>', 'Project path (default: current directory)', process.cwd())
  .action(async (options) => {
    const result = await envModule.validate(options.path);
    process.exit(result.passed ? 0 : 1);
  });

program
  .command('auth')
  .description('Check auth middleware & route protection')
  .option('-p, --path <path>', 'Project path (default: current directory)', process.cwd())
  .action(async (options) => {
    const result = await authModule.validate(options.path);
    process.exit(result.passed ? 0 : 1);
  });

program
  .command('api')
  .description('Check health endpoint + route consistency')
  .option('-p, --path <path>', 'Project path (default: current directory)', process.cwd())
  .action(async (options) => {
    const result = await apiModule.validate(options.path);
    process.exit(result.passed ? 0 : 1);
  });

program
  .command('project')
  .description('Check project structure, README, .env.example, error handling')
  .option('-p, --path <path>', 'Project path (default: current directory)', process.cwd())
  .action(async (options) => {
    const result = await projectModule.validate(options.path);
    process.exit(result.passed ? 0 : 1);
  });

program
  .command('security')
  .description('Check security configurations (CORS, headers, rate limiting)')
  .option('-p, --path <path>', 'Project path (default: current directory)', process.cwd())
  .action(async (options) => {
    const result = await securityModule.validate(options.path);
    process.exit(result.passed ? 0 : 1);
  });

program
  .command('dependencies')
  .description('Check dependencies for vulnerabilities and best practices')
  .option('-p, --path <path>', 'Project path (default: current directory)', process.cwd())
  .action(async (options) => {
    const result = await dependenciesModule.validate(options.path);
    process.exit(result.passed ? 0 : 1);
  });

program
  .command('database')
  .description('Validate database configuration and connection handling')
  .option('-p, --path <path>', 'Project path (default: current directory)', process.cwd())
  .action(async (options) => {
    const result = await databaseModule.validate(options.path);
    process.exit(result.passed ? 0 : 1);
  });

program
  .command('report')
  .description('Generate final summary combining all checks')
  .option('-p, --path <path>', 'Project path (default: current directory)', process.cwd())
  .option('--json', 'Export results to JSON')
  .option('--verbose', 'Show detailed logs')
  .option('--skip <modules>', 'Skip specific modules (comma-separated)', (value) => value.split(','))
  .action(async (options) => {
    const result = await reportModule.generate(options.path, {
      json: options.json,
      verbose: options.verbose,
      skip: options.skip || []
    });
    process.exit(result.passed ? 0 : 1);
  });

program
  .command('fix')
  .description('Generate auto-fix suggestions for common issues')
  .option('-p, --path <path>', 'Project path (default: current directory)', process.cwd())
  .option('--apply', 'Apply fixes automatically (creates files)')
  .action(async (options) => {
    const { generateFixes, applyFixes } = require('./utils/fixHelpers');
    
    // Run all checks to get issues
    const results = {
      env: await envModule.validate(options.path),
      auth: await authModule.validate(options.path),
      api: await apiModule.validate(options.path),
      project: await projectModule.validate(options.path),
      security: await securityModule.validate(options.path)
    };
    
    // Collect all issues
    const allIssues = [];
    Object.values(results).forEach(result => {
      if (result.issues) allIssues.push(...result.issues);
      if (result.warnings) allIssues.push(...result.warnings);
    });
    
    // Generate fixes
    const fixes = await generateFixes(allIssues, options.path);
    
    if (fixes.length === 0) {
      console.log(chalk.green('\n✅ No fixes needed!'));
      return;
    }
    
    console.log(chalk.cyan('\n🔧 AUTO-FIX SUGGESTIONS\n'));
    
    if (options.apply) {
      const applied = await applyFixes(fixes, options.path, false);
      applied.forEach(fix => {
        if (fix.status === 'created') {
          console.log(chalk.green(`✅ Created: ${fix.filePath}`));
        } else if (fix.status === 'suggestion') {
          console.log(chalk.yellow(`💡 ${fix.description}`));
        }
      });
    } else {
      fixes.forEach((fix, index) => {
        console.log(chalk.yellow(`\n${index + 1}. ${fix.description}`));
        if (fix.type === 'create_file') {
          console.log(chalk.gray(`   Would create: ${fix.file}`));
          console.log(chalk.gray('   Run with --apply to create this file'));
        }
      });
      console.log(chalk.cyan('\n💡 Run with --apply to automatically create files'));
    }
  });

program.parse();

