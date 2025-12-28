const path = require('path');
const { fileExists, parseEnvFile, readFile } = require('../utils/fileHelpers');
const { error, success, verdict, printIssues } = require('../utils/logHelpers');
const { isValidUrl, isValidEmail, isValidNumber } = require('../utils/parseHelpers');

/**
 * Validate environment variables
 */
async function validate(projectPath = process.cwd()) {
  const issues = [];
  const warnings = [];
  
  const envPath = path.join(projectPath, '.env');
  const envExamplePath = path.join(projectPath, '.env.example');
  
  // Check if .env exists
  const envExists = await fileExists(envPath);
  const envExampleExists = await fileExists(envExamplePath);
  
  if (!envExists) {
    issues.push('MISSING: .env file not found');
  }
  
  if (!envExampleExists) {
    warnings.push('WARNING: .env.example file not found (recommended for team collaboration)');
  }
  
  // Parse .env.example to get expected variables
  let expectedVars = {};
  if (envExampleExists) {
    expectedVars = await parseEnvFile(envExamplePath);
  }
  
  // Parse .env file
  let actualVars = {};
  if (envExists) {
    actualVars = await parseEnvFile(envPath);
  }
  
  // Check for missing variables
  const missingVars = Object.keys(expectedVars).filter(key => !(key in actualVars));
  missingVars.forEach(key => {
    issues.push(`MISSING: ${key}`);
  });
  
  // Check for weak secrets
  const secretKeys = Object.keys(actualVars).filter(key => 
    /SECRET|KEY|PASSWORD|TOKEN/i.test(key)
  );
  
  secretKeys.forEach(key => {
    const value = actualVars[key];
    if (!value) {
      issues.push(`EMPTY: ${key} is empty`);
    } else if (value.length < 32 && key.toUpperCase().includes('SECRET')) {
      issues.push(`WEAK SECRET: ${key} (length < 32)`);
    } else if (value.length < 16 && /PASSWORD|KEY/i.test(key)) {
      warnings.push(`WEAK: ${key} might be too short (length < 16)`);
    }
  });
  
  // Check for unused variables (in .env but not in .env.example)
  if (envExampleExists) {
    const unusedVars = Object.keys(actualVars).filter(key => 
      !(key in expectedVars) && !key.startsWith('#')
    );
    if (unusedVars.length > 0) {
      warnings.push(`UNUSED: Variables in .env but not in .env.example: ${unusedVars.join(', ')}`);
    }
  }
  
  // Type validation (basic checks)
  Object.keys(actualVars).forEach(key => {
    const value = actualVars[key];
    
    if (key.includes('URL') && value && !isValidUrl(value) && !value.startsWith('${')) {
      warnings.push(`INVALID URL: ${key} does not appear to be a valid URL`);
    }
    
    if (key.includes('EMAIL') && value && !isValidEmail(value) && !value.startsWith('${')) {
      warnings.push(`INVALID EMAIL: ${key} does not appear to be a valid email`);
    }
    
    if (key.includes('PORT') && value && !isValidNumber(value)) {
      warnings.push(`INVALID PORT: ${key} should be a number`);
    }
  });
  
  // Print results
  console.log('\n🔹 ENV VALIDATION\n');
  
  if (issues.length === 0 && warnings.length === 0) {
    success('All environment variables are properly configured');
    verdict(true, 'ENV: READY');
    return { passed: true, issues: [], warnings: [] };
  }
  
  printIssues(issues, 'error');
  printIssues(warnings, 'warning');
  
  verdict(false, 'ENV: NOT READY');
  
  return {
    passed: issues.length === 0,
    issues,
    warnings
  };
}

module.exports = {
  validate
};

