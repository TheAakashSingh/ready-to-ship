const envModule = require('./env');
const authModule = require('./auth');
const apiModule = require('./api');
const projectModule = require('./project');
const securityModule = require('./security');
const dependenciesModule = require('./dependencies');
const databaseModule = require('./database');
const { header, verdict, error, success } = require('../utils/logHelpers');

/**
 * Generate comprehensive report combining all checks
 */
async function generate(projectPath = process.cwd(), options = {}) {
  const { json = false, verbose = false, skip = [] } = options;
  
  header('READY-TO-SHIP REPORT');
  
  // Run all validations (skip specified modules)
  const allModules = {
    env: envModule,
    auth: authModule,
    api: apiModule,
    project: projectModule,
    security: securityModule,
    dependencies: dependenciesModule,
    database: databaseModule
  };
  
  const results = {};
  for (const [name, module] of Object.entries(allModules)) {
    if (!skip.includes(name)) {
      results[name] = await module.validate(projectPath);
    }
  }
  
  // Calculate overall status
  const allPassed = Object.values(results).every(result => result.passed);
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50) + '\n');
  
  const statusIcon = (passed) => passed ? '✅' : '❌';
  const statusText = (passed) => passed ? 'PASS' : 'FAIL';
  
  // Print module statuses
  Object.entries(results).forEach(([name, result]) => {
    const nameUpper = name.toUpperCase().padEnd(12);
    console.log(`${nameUpper} ${statusIcon(result.passed)} ${statusText(result.passed)}`);
  });
  
  // Count issues
  const totalIssues = Object.values(results).reduce((sum, result) => sum + (result.issues?.length || 0), 0);
  const totalWarnings = Object.values(results).reduce((sum, result) => sum + (result.warnings?.length || 0), 0);
  
  console.log('\n' + '='.repeat(50));
  console.log(`Total Issues: ${totalIssues}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log('='.repeat(50) + '\n');
  
  // Final verdict
  if (allPassed) {
    verdict(true, 'FINAL VERDICT: ✅ READY TO SHIP');
    success('Your backend project looks ready for deployment!');
  } else {
    verdict(false, 'FINAL VERDICT: ❌ NOT READY');
    error('Please fix the issues above before deploying.');
    
    if (verbose) {
      console.log('\n📋 Detailed Issues:\n');
      Object.entries(results).forEach(([module, result]) => {
        if (result.issues && result.issues.length > 0) {
          console.log(`\n${module.toUpperCase()}:`);
          result.issues.forEach(issue => error(`  - ${issue}`));
        }
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
        }
      });
    }
  }
  
  // Export to JSON if requested
  if (json) {
    const jsonReport = {
      timestamp: new Date().toISOString(),
      projectPath,
      verdict: allPassed ? 'READY' : 'NOT_READY',
      summary: Object.fromEntries(
        Object.entries(results).map(([name, result]) => [
          name,
          {
            passed: result.passed,
            issues: result.issues?.length || 0,
            warnings: result.warnings?.length || 0
          }
        ])
      ),
      details: results
    };
    
    const fs = require('fs-extra');
    const reportPath = require('path').join(projectPath, 'ready-to-ship-report.json');
    await fs.writeJson(reportPath, jsonReport, { spaces: 2 });
    console.log(`\n📄 JSON report saved to: ${reportPath}`);
  }
  
  return {
    passed: allPassed,
    results
  };
}

module.exports = {
  generate
};

