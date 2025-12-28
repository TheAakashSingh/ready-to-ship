const path = require('path');
const { findFiles, readFile } = require('../utils/fileHelpers');
const { error, success, verdict, printIssues } = require('../utils/logHelpers');

/**
 * Validate security configurations
 */
async function validate(projectPath = process.cwd()) {
  const issues = [];
  const warnings = [];
  
  // Find main app files
  const appFiles = await findFiles('**/{app,server,index,main}.{js,ts}', projectPath);
  const configFiles = await findFiles('**/config/**/*.{js,ts}', projectPath);
  const middlewareFiles = await findFiles('**/middleware/**/*.{js,ts}', projectPath);
  
  const allFiles = [...appFiles, ...configFiles, ...middlewareFiles];
  
  let hasCORS = false;
  let hasHelmet = false;
  let hasRateLimit = false;
  let hasSecurityHeaders = false;
  let corsConfig = null;
  
  // Analyze files for security features
  for (const filePath of allFiles.slice(0, 20)) { // Limit to first 20 files
    const code = await readFile(filePath);
    if (!code) continue;
    
    // Check for CORS
    if (/cors|CORS/i.test(code)) {
      hasCORS = true;
      const corsMatch = code.match(/cors\s*\([^)]*\)/i);
      if (corsMatch) {
        corsConfig = corsMatch[0];
        // Check for overly permissive CORS
        if (/origin\s*:\s*['"]\*['"]/i.test(corsConfig)) {
          issues.push('CORS configured with wildcard origin (*) - security risk');
        }
      }
    }
    
    // Check for Helmet.js (security headers)
    if (/helmet|helmet\(\)/i.test(code)) {
      hasHelmet = true;
      hasSecurityHeaders = true;
    }
    
    // Check for security headers manually
    if (/x-frame-options|x-content-type-options|x-xss-protection|strict-transport-security/i.test(code)) {
      hasSecurityHeaders = true;
    }
    
    // Check for rate limiting
    if (/rateLimit|rate-limit|express-rate-limit|limiter/i.test(code)) {
      hasRateLimit = true;
    }
  }
  
  // Check package.json for security dependencies
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJsonContent = await readFile(packageJsonPath);
  let packageJson = {};
  
  if (packageJsonContent) {
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch (e) {
      // Invalid JSON
    }
  }
  
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const securityPackages = {
    'helmet': 'helmet',
    'cors': 'cors',
    'express-rate-limit': 'express-rate-limit',
    'express-slow-down': 'express-slow-down',
    'hpp': 'hpp',
    'xss': 'xss'
  };
  
  Object.keys(securityPackages).forEach(pkg => {
    if (!deps[pkg] && !hasHelmet && pkg === 'helmet') {
      warnings.push(`Security package "${pkg}" not found (recommended: npm install ${pkg})`);
    }
  });
  
  // Security checks
  if (!hasCORS) {
    warnings.push('CORS middleware not detected (recommended for API security)');
  }
  
  if (!hasSecurityHeaders) {
    issues.push('Security headers not configured (use Helmet.js or configure manually)');
  }
  
  if (!hasRateLimit) {
    warnings.push('Rate limiting not detected (recommended to prevent abuse)');
  }
  
  // Check for common security anti-patterns
  for (const filePath of allFiles.slice(0, 10)) {
    const code = await readFile(filePath);
    if (!code) continue;
    
    // Check for eval usage
    if (/\beval\s*\(/i.test(code)) {
      issues.push(`eval() usage detected in ${path.relative(projectPath, filePath)} - security risk`);
    }
    
    // Check for dangerous regex
    if (/new RegExp\([^)]*\+/i.test(code)) {
      warnings.push(`Dynamic regex construction in ${path.relative(projectPath, filePath)} - potential ReDoS risk`);
    }
  }
  
  // Print results
  console.log('\n🔹 SECURITY VALIDATION\n');
  
  if (hasCORS) success('CORS configured');
  if (hasSecurityHeaders) success('Security headers configured');
  if (hasRateLimit) success('Rate limiting detected');
  
  if (issues.length === 0 && warnings.length === 0) {
    success('Security configuration looks good');
    verdict(true, 'SECURITY: READY');
    return { passed: true, issues: [], warnings: [] };
  }
  
  printIssues(issues, 'error');
  printIssues(warnings, 'warning');
  
  verdict(false, 'SECURITY: NOT READY');
  
  return {
    passed: issues.length === 0,
    issues,
    warnings
  };
}

module.exports = {
  validate
};

