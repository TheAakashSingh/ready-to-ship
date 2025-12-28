const path = require('path');
const { getAllFiles, readFile } = require('../utils/fileHelpers');
const { error, success, verdict, printIssues } = require('../utils/logHelpers');
const { extractRoutes, hasAuthMiddleware, extractJWTExpiry } = require('../utils/parseHelpers');

/**
 * Validate authentication and route protection
 */
async function validate(projectPath = process.cwd()) {
  const issues = [];
  const warnings = [];
  const vulnerableRoutes = [];
  
  // Find route files
  const routePatterns = [
    '**/routes/**/*.{js,ts,jsx,tsx}',
    '**/routes.{js,ts,jsx,tsx}',
    '**/api/**/*.{js,ts,jsx,tsx}',
    '**/controllers/**/*.{js,ts,jsx,tsx}',
    '**/src/**/*.{js,ts,jsx,tsx}'
  ];
  
  let routeFiles = [];
  for (const pattern of routePatterns) {
    const files = await require('../utils/fileHelpers').findFiles(pattern, projectPath);
    routeFiles.push(...files);
  }
  
  // If no route files found, try to find main app file
  if (routeFiles.length === 0) {
    const mainFiles = await require('../utils/fileHelpers').findFiles('**/{app,server,index,main}.{js,ts}', projectPath);
    routeFiles.push(...mainFiles);
  }
  
  if (routeFiles.length === 0) {
    warnings.push('No route files found. Make sure your project structure is standard.');
    verdict(false, 'AUTH: NOT READY (No routes found)');
    return { passed: false, issues, warnings, vulnerableRoutes: [] };
  }
  
  // Analyze each route file
  for (const filePath of routeFiles) {
    const code = await readFile(filePath);
    if (!code) continue;
    
    const routes = extractRoutes(code);
    const lines = code.split('\n');
    
    routes.forEach(route => {
      const routePath = route.path;
      const method = route.method;
      const isSensitive = isSensitiveRoute(routePath);
      
      if (isSensitive) {
        // Check if route has auth middleware
        const hasAuth = hasAuthMiddleware(code, route.line);
        
        if (!hasAuth) {
          vulnerableRoutes.push({
            method,
            path: routePath,
            file: path.relative(projectPath, filePath),
            line: route.line
          });
          issues.push(`Route ${method} ${routePath} missing auth middleware (${path.relative(projectPath, filePath)})`);
        }
      }
    });
    
    // Check JWT expiry configuration
    const jwtExpiry = extractJWTExpiry(code);
    if (jwtExpiry !== null) {
      const maxRecommendedExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
      const oneYearInSeconds = 365 * 24 * 60 * 60;
      
      if (jwtExpiry > oneYearInSeconds) {
        issues.push(`JWT expiry too long: ${formatDuration(jwtExpiry)} (recommended: < 7 days)`);
      } else if (jwtExpiry > maxRecommendedExpiry) {
        warnings.push(`JWT expiry is ${formatDuration(jwtExpiry)} (recommended: < 7 days)`);
      }
    }
  }
  
  // Print results
  console.log('\n🔹 AUTH VALIDATION\n');
  
  if (issues.length === 0 && warnings.length === 0) {
    success('All routes are properly protected');
    verdict(true, 'AUTH: READY');
    return { passed: true, issues: [], warnings: [], vulnerableRoutes: [] };
  }
  
  printIssues(issues, 'error');
  printIssues(warnings, 'warning');
  
  if (vulnerableRoutes.length > 0) {
    console.log('\n📋 Vulnerable Routes:');
    vulnerableRoutes.forEach(route => {
      error(`${route.method} ${route.path} (${route.file}:${route.line})`);
    });
  }
  
  verdict(false, 'AUTH: NOT READY');
  
  return {
    passed: issues.length === 0,
    issues,
    warnings,
    vulnerableRoutes
  };
}

/**
 * Check if route is sensitive and requires auth
 */
function isSensitiveRoute(path) {
  const sensitivePatterns = [
    /^\/admin/i,
    /^\/api\/admin/i,
    /\/users/i,
    /\/profile/i,
    /\/settings/i,
    /\/account/i,
    /\/dashboard/i,
    /\/delete/i,
    /\/update/i,
    /\/create/i,
    /\/edit/i,
    /\/password/i,
    /\/auth\/change/i,
    /\/api\/v\d+\/.*(?:user|admin|auth|profile|settings)/i
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(path));
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months`;
  return `${Math.floor(seconds / 31536000)} years`;
}

module.exports = {
  validate
};

