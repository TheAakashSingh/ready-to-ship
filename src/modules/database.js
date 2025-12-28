const path = require('path');
const { findFiles, readFile, parseEnvFile, fileExists } = require('../utils/fileHelpers');
const { error, success, verdict, printIssues } = require('../utils/logHelpers');

/**
 * Validate database configuration
 */
async function validate(projectPath = process.cwd()) {
  const issues = [];
  const warnings = [];
  
  // Check for database connection strings in .env
  const envPath = path.join(projectPath, '.env');
  let envVars = {};
  
  if (await fileExists(envPath)) {
    envVars = await parseEnvFile(envPath);
  }
  
  // Detect database type from env vars
  const dbVars = Object.keys(envVars).filter(key => 
    /DATABASE|DB|MONGO|POSTGRES|MYSQL|REDIS/i.test(key)
  );
  
  let hasDbConfig = dbVars.length > 0;
  let dbType = null;
  
  if (envVars.DATABASE_URL) {
    const dbUrl = envVars.DATABASE_URL.toLowerCase();
    if (dbUrl.includes('mongodb')) dbType = 'MongoDB';
    else if (dbUrl.includes('postgres')) dbType = 'PostgreSQL';
    else if (dbUrl.includes('mysql')) dbType = 'MySQL';
    else if (dbUrl.includes('redis')) dbType = 'Redis';
  }
  
  // Check package.json for database drivers
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
  const dbPackages = {
    'mongoose': 'MongoDB',
    'mongodb': 'MongoDB',
    'pg': 'PostgreSQL',
    'mysql2': 'MySQL',
    'mysql': 'MySQL',
    'redis': 'Redis',
    'ioredis': 'Redis',
    'prisma': 'Prisma ORM',
    'sequelize': 'Sequelize ORM',
    'typeorm': 'TypeORM'
  };
  
  let detectedDbPackage = null;
  Object.keys(dbPackages).forEach(pkg => {
    if (deps[pkg]) {
      detectedDbPackage = dbPackages[pkg];
      if (!dbType) dbType = dbPackages[pkg];
    }
  });
  
  // Check for database connection files
  const dbFiles = await findFiles('**/{db,database,config}/**/*.{js,ts}', projectPath);
  const connectionFiles = await findFiles('**/*connection*.{js,ts}', projectPath);
  const modelFiles = await findFiles('**/{models,schemas}/**/*.{js,ts}', projectPath);
  
  let hasConnectionFile = dbFiles.length > 0 || connectionFiles.length > 0;
  let hasModels = modelFiles.length > 0;
  
  // Check for connection error handling
  let hasConnectionHandling = false;
  for (const filePath of [...dbFiles, ...connectionFiles].slice(0, 10)) {
    const code = await readFile(filePath);
    if (code) {
      if (/catch|error|on\('error'\)/i.test(code)) {
        hasConnectionHandling = true;
        break;
      }
    }
  }
  
  // Validation checks
  if (!hasDbConfig && !detectedDbPackage) {
    warnings.push('No database configuration detected');
  } else {
    if (dbType) {
      success(`Database type detected: ${dbType}`);
    }
    
    // Check for connection string security
    if (envVars.DATABASE_URL) {
      const dbUrl = envVars.DATABASE_URL;
      if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
        warnings.push('Database URL points to localhost (ensure production uses remote database)');
      }
      
      // Check for credentials in URL (should be in env)
      if (!dbUrl.startsWith('${') && dbUrl.includes('@') && !dbUrl.includes('://')) {
        // Might be okay, but check format
      }
    }
    
    // Check for missing connection handling
    if (!hasConnectionHandling && hasConnectionFile) {
      issues.push('Database connection error handling not detected');
    }
    
    // Check for connection pooling
    let hasPooling = false;
    for (const filePath of [...dbFiles, ...connectionFiles].slice(0, 10)) {
      const code = await readFile(filePath);
      if (code && /pool|pooling|max.*connection/i.test(code)) {
        hasPooling = true;
        break;
      }
    }
    
    if (!hasPooling && detectedDbPackage) {
      warnings.push('Connection pooling not detected (recommended for production)');
    }
  }
  
  // Check for migration files
  const migrationFiles = await findFiles('**/{migrations,migrate}/**/*.{js,ts,sql}', projectPath);
  if (migrationFiles.length === 0 && detectedDbPackage) {
    warnings.push('No migration files detected (recommended for database versioning)');
  }
  
  // Print results
  console.log('\n🔹 DATABASE VALIDATION\n');
  
  if (hasDbConfig || detectedDbPackage) {
    if (hasConnectionFile) success('Database connection file found');
    if (hasModels) success('Database models/schemas found');
    if (hasConnectionHandling) success('Connection error handling found');
  }
  
  if (issues.length === 0 && warnings.length === 0 && (hasDbConfig || detectedDbPackage)) {
    success('Database configuration looks good');
    verdict(true, 'DATABASE: READY');
    return { passed: true, issues: [], warnings: [] };
  }
  
  if (!hasDbConfig && !detectedDbPackage) {
    verdict(true, 'DATABASE: SKIPPED (No database detected)');
    return { passed: true, issues: [], warnings: [], skipped: true };
  }
  
  printIssues(issues, 'error');
  printIssues(warnings, 'warning');
  
  verdict(false, 'DATABASE: NOT READY');
  
  return {
    passed: issues.length === 0,
    issues,
    warnings,
    dbType
  };
}

module.exports = {
  validate
};

