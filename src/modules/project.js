const path = require('path');
const { fileExists, readFile, getAllFiles } = require('../utils/fileHelpers');
const { error, success, verdict, printIssues } = require('../utils/logHelpers');
const { hasErrorHandling } = require('../utils/parseHelpers');

/**
 * Validate project structure and best practices
 */
async function validate(projectPath = process.cwd()) {
  const issues = [];
  const warnings = [];
  
  // Check for .env.example
  const envExamplePath = path.join(projectPath, '.env.example');
  const envExampleExists = await fileExists(envExamplePath);
  
  if (!envExampleExists) {
    issues.push('.env.example missing (required for team collaboration)');
  }
  
  // Check for README
  const readmePaths = [
    path.join(projectPath, 'README.md'),
    path.join(projectPath, 'README.txt'),
    path.join(projectPath, 'readme.md')
  ];
  
  let readmeExists = false;
  let readmePath = null;
  let readmeContent = '';
  
  for (const readmePathOption of readmePaths) {
    if (await fileExists(readmePathOption)) {
      readmeExists = true;
      readmePath = readmePathOption;
      readmeContent = await readFile(readmePathOption) || '';
      break;
    }
  }
  
  if (!readmeExists) {
    issues.push('README missing');
  } else {
    // Check if README has meaningful content
    const meaningfulContent = readmeContent.length > 100;
    const hasInstallation = /install|setup|getting started/i.test(readmeContent);
    const hasUsage = /usage|how to|example/i.test(readmeContent);
    
    if (!meaningfulContent) {
      warnings.push('README exists but seems too short or empty');
    } else if (!hasInstallation && !hasUsage) {
      warnings.push('README missing installation or usage instructions');
    }
  }
  
  // Check folder structure
  const expectedFolders = ['src', 'routes', 'config', 'middleware', 'controllers', 'models'];
  const existingFolders = [];
  
  for (const folder of expectedFolders) {
    const folderPath = path.join(projectPath, folder);
    if (await fileExists(folderPath)) {
      existingFolders.push(folder);
    }
  }
  
  // Check for src/ or similar structure
  const srcPath = path.join(projectPath, 'src');
  const hasSrc = await fileExists(srcPath);
  
  if (!hasSrc && existingFolders.length === 0) {
    warnings.push('No standard project structure detected (src/, routes/, etc.)');
  }
  
  // Check for error handling
  let hasGlobalErrorHandler = false;
  const errorHandlerPatterns = [
    '**/middleware/**/*.{js,ts}',
    '**/middleware.{js,ts}',
    '**/error*.{js,ts}',
    '**/src/**/*.{js,ts}'
  ];
  
  for (const pattern of errorHandlerPatterns) {
    const files = await require('../utils/fileHelpers').findFiles(pattern, projectPath);
    for (const filePath of files.slice(0, 10)) { // Limit to first 10 files
      const code = await readFile(filePath);
      if (code && hasErrorHandling(code)) {
        hasGlobalErrorHandler = true;
        break;
      }
    }
    if (hasGlobalErrorHandler) break;
  }
  
  // Also check main app file
  if (!hasGlobalErrorHandler) {
    const mainFiles = await require('../utils/fileHelpers').findFiles('**/{app,server,index,main}.{js,ts}', projectPath);
    for (const filePath of mainFiles.slice(0, 3)) {
      const code = await readFile(filePath);
      if (code && hasErrorHandling(code)) {
        hasGlobalErrorHandler = true;
        break;
      }
    }
  }
  
  if (!hasGlobalErrorHandler) {
    issues.push('Error handling middleware not found (recommended: global error handler)');
  }
  
  // Check for package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJsonExists = await fileExists(packageJsonPath);
  
  if (!packageJsonExists) {
    issues.push('package.json missing');
  } else {
    const packageJsonContent = await readFile(packageJsonPath);
    if (packageJsonContent) {
      try {
        const pkg = JSON.parse(packageJsonContent);
        
        // Check for start script
        if (!pkg.scripts || !pkg.scripts.start) {
          warnings.push('package.json missing "start" script');
        }
        
        // Check for description
        if (!pkg.description) {
          warnings.push('package.json missing "description" field');
        }
      } catch (e) {
        warnings.push('package.json might be malformed');
      }
    }
  }
  
  // Print results
  console.log('\n🔹 PROJECT VALIDATION\n');
  
  if (readmeExists) {
    success('README found');
  }
  
  if (envExampleExists) {
    success('.env.example found');
  }
  
  if (hasGlobalErrorHandler) {
    success('Error handling found');
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    success('Project structure looks good');
    verdict(true, 'PROJECT: READY');
    return { passed: true, issues: [], warnings: [] };
  }
  
  printIssues(issues, 'error');
  printIssues(warnings, 'warning');
  
  verdict(false, 'PROJECT: NOT READY');
  
  return {
    passed: issues.length === 0,
    issues,
    warnings
  };
}

module.exports = {
  validate
};

