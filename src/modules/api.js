const path = require('path');
const { findFiles, readFile, fileExists } = require('../utils/fileHelpers');
const { error, success, verdict, printIssues } = require('../utils/logHelpers');
const { extractRoutes } = require('../utils/parseHelpers');

/**
 * Validate API endpoints and health checks
 */
async function validate(projectPath = process.cwd()) {
  const issues = [];
  const warnings = [];
  
  // Find route files
  const routePatterns = [
    '**/routes/**/*.{js,ts,jsx,tsx}',
    '**/routes.{js,ts,jsx,tsx}',
    '**/api/**/*.{js,ts,jsx,tsx}',
    '**/src/**/*.{js,ts,jsx,tsx}'
  ];
  
  let routeFiles = [];
  for (const pattern of routePatterns) {
    const files = await findFiles(pattern, projectPath);
    routeFiles.push(...files);
  }
  
  // If no route files found, try to find main app file
  if (routeFiles.length === 0) {
    const mainFiles = await findFiles('**/{app,server,index,main}.{js,ts}', projectPath);
    routeFiles.push(...mainFiles);
  }
  
  if (routeFiles.length === 0) {
    warnings.push('No route files found. Make sure your project structure is standard.');
    verdict(false, 'API: NOT READY (No routes found)');
    return { passed: false, issues, warnings };
  }
  
  // Check for health endpoint
  let hasHealthEndpoint = false;
  const healthPatterns = ['/health', '/healthz', '/ping', '/status', '/api/health'];
  
  for (const filePath of routeFiles) {
    const code = await readFile(filePath);
    if (!code) continue;
    
    const routes = extractRoutes(code);
    
    // Check if any route matches health patterns
    const healthRoutes = routes.filter(route => 
      healthPatterns.some(pattern => route.path === pattern || route.path.startsWith(pattern + '/'))
    );
    
    if (healthRoutes.length > 0) {
      hasHealthEndpoint = true;
      break;
    }
  }
  
  if (!hasHealthEndpoint) {
    issues.push('/health endpoint missing (recommended for monitoring and load balancers)');
  }
  
  // Check route consistency
  const allRoutes = [];
  for (const filePath of routeFiles) {
    const code = await readFile(filePath);
    if (!code) continue;
    
    const routes = extractRoutes(code);
    routes.forEach(route => {
      allRoutes.push({
        ...route,
        file: path.relative(projectPath, filePath)
      });
    });
  }
  
  // Group routes by path
  const routesByPath = {};
  allRoutes.forEach(route => {
    if (!routesByPath[route.path]) {
      routesByPath[route.path] = [];
    }
    routesByPath[route.path].push(route.method);
  });
  
  // Check for common REST inconsistencies
  Object.keys(routesByPath).forEach(path => {
    const methods = routesByPath[path];
    
    // If POST exists, usually should have GET for the collection
    if (methods.includes('POST') && !methods.includes('GET')) {
      const collectionPath = path.replace(/\/[^/]+$/, '');
      if (collectionPath !== path && !routesByPath[collectionPath]?.includes('GET')) {
        warnings.push(`POST ${path} exists but no GET endpoint for collection`);
      }
    }
    
    // If PUT/PATCH exists, usually should have GET for the resource
    if ((methods.includes('PUT') || methods.includes('PATCH')) && !methods.includes('GET')) {
      warnings.push(`${methods.find(m => ['PUT', 'PATCH'].includes(m))} ${path} exists but no GET endpoint`);
    }
  });
  
  // Print results
  console.log('\n🔹 API VALIDATION\n');
  
  if (hasHealthEndpoint) {
    success('Health endpoint found');
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    success('API structure looks good');
    verdict(true, 'API: READY');
    return { passed: true, issues: [], warnings, routes: allRoutes };
  }
  
  printIssues(issues, 'error');
  printIssues(warnings, 'warning');
  
  verdict(false, 'API: NOT READY');
  
  return {
    passed: issues.length === 0,
    issues,
    warnings,
    routes: allRoutes
  };
}

module.exports = {
  validate
};

