const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

/**
 * Read file content safely
 */
async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    return await fs.pathExists(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Find files matching pattern
 */
function findFiles(pattern, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    glob(pattern, { cwd, absolute: true }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

/**
 * Get all files in directory recursively
 */
async function getAllFiles(dir, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
  const files = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await getAllFiles(fullPath, extensions));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.length === 0 || extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or permission denied
  }
  return files;
}

/**
 * Parse .env file
 */
async function parseEnvFile(filePath) {
  const content = await readFile(filePath);
  if (!content) return {};
  
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  }
  
  return env;
}

module.exports = {
  readFile,
  fileExists,
  findFiles,
  getAllFiles,
  parseEnvFile
};

