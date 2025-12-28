const path = require('path');
const { readFile, fileExists } = require('../utils/fileHelpers');
const { error, success, verdict, printIssues, warning } = require('../utils/logHelpers');

/**
 * Validate dependencies
 */
async function validate(projectPath = process.cwd()) {
  const issues = [];
  const warnings = [];
  
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageLockPath = path.join(projectPath, 'package-lock.json');
  const yarnLockPath = path.join(projectPath, 'yarn.lock');
  
  // Check for package.json
  if (!await fileExists(packageJsonPath)) {
    issues.push('package.json not found');
    verdict(false, 'DEPENDENCIES: NOT READY');
    return { passed: false, issues, warnings: [] };
  }
  
  const packageJsonContent = await readFile(packageJsonPath);
  let packageJson = {};
  
  try {
    packageJson = JSON.parse(packageJsonContent);
  } catch (e) {
    issues.push('package.json is malformed');
    verdict(false, 'DEPENDENCIES: NOT READY');
    return { passed: false, issues, warnings: [] };
  }
  
  // Check for lock file
  const hasLockFile = await fileExists(packageLockPath) || await fileExists(yarnLockPath);
  if (!hasLockFile) {
    warnings.push('Lock file (package-lock.json or yarn.lock) not found (recommended for reproducible builds)');
  }
  
  // Check for critical dependencies
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const criticalDeps = {
    'express': 'Express.js',
    'fastify': 'Fastify',
    'koa': 'Koa',
    'nestjs': 'NestJS'
  };
  
  let hasFramework = false;
  Object.keys(criticalDeps).forEach(dep => {
    if (deps[dep]) {
      hasFramework = true;
    }
  });
  
  if (!hasFramework) {
    warnings.push('No major web framework detected (Express, Fastify, Koa, NestJS)');
  }
  
  // Check for outdated packages (basic check)
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.replace('v', '').split('.')[0]);
  
  if (nodeMajor < 14) {
    warnings.push(`Node.js version ${nodeVersion} is outdated (recommended: >= 14.0.0)`);
  }
  
  // Check for common security-related packages
  const securityPackages = ['helmet', 'cors', 'express-rate-limit', 'bcrypt', 'jsonwebtoken'];
  const missingSecurity = securityPackages.filter(pkg => !deps[pkg]);
  
  if (missingSecurity.length > 0) {
    warnings.push(`Missing security packages: ${missingSecurity.join(', ')}`);
  }
  
  // Check for vulnerable patterns in dependencies
  const vulnerablePatterns = {
    'express': { min: '4.17.0', reason: 'Older versions have security vulnerabilities' },
    'lodash': { min: '4.17.21', reason: 'Older versions have security vulnerabilities' }
  };
  
  Object.keys(vulnerablePatterns).forEach(pkg => {
    if (deps[pkg]) {
      const version = deps[pkg].replace(/[\^~]/, '');
      const pattern = vulnerablePatterns[pkg];
      // Basic version check (simplified)
      if (version && version.includes('4.') && pkg === 'express') {
        warnings.push(`${pkg} version might be outdated - ${pattern.reason}`);
      }
    }
  });
  
  // Check for too many dependencies (maintenance burden)
  const totalDeps = Object.keys(deps).length;
  if (totalDeps > 100) {
    warnings.push(`Large number of dependencies (${totalDeps}) - consider reviewing for unused packages`);
  }
  
  // Check for dev dependencies in production
  if (packageJson.scripts && packageJson.scripts.start) {
    const startScript = packageJson.scripts.start;
    if (startScript.includes('nodemon') || startScript.includes('ts-node-dev')) {
      warnings.push('Development tools in start script (use production tools in production)');
    }
  }
  
  // Try to run npm audit (if available)
  let auditIssues = [];
  try {
    // Check if npm audit is available (don't run it, just check)
    const hasNpmAudit = true; // Assume available
    if (hasNpmAudit) {
      warnings.push('Run "npm audit" to check for known vulnerabilities');
    }
  } catch (e) {
    // npm audit not available or failed
  }
  
  // Print results
  console.log('\n🔹 DEPENDENCIES VALIDATION\n');
  
  if (hasLockFile) success('Lock file found');
  if (hasFramework) success('Web framework detected');
  
  if (issues.length === 0 && warnings.length === 0) {
    success('Dependencies look good');
    verdict(true, 'DEPENDENCIES: READY');
    return { passed: true, issues: [], warnings: [] };
  }
  
  printIssues(issues, 'error');
  printIssues(warnings, 'warning');
  
  verdict(false, 'DEPENDENCIES: NOT READY');
  
  return {
    passed: issues.length === 0,
    issues,
    warnings,
    totalDependencies: totalDeps
  };
}

module.exports = {
  validate
};

