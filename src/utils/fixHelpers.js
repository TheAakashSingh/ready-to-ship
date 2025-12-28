const fs = require('fs-extra');
const path = require('path');
const { fileExists, readFile } = require('./fileHelpers');

/**
 * Generate auto-fix suggestions
 */
async function generateFixes(issues, projectPath) {
  const fixes = [];
  
  issues.forEach(issue => {
    const issueLower = issue.toLowerCase();
    
    // .env.example fixes
    if (issueLower.includes('.env.example')) {
      fixes.push({
        type: 'create_file',
        file: '.env.example',
        content: generateEnvExampleTemplate(),
        description: 'Create .env.example file'
      });
    }
    
    // README fixes
    if (issueLower.includes('readme')) {
      fixes.push({
        type: 'create_file',
        file: 'README.md',
        content: generateReadmeTemplate(),
        description: 'Create README.md file'
      });
    }
    
    // Weak secret fixes
    if (issueLower.includes('weak secret')) {
      const match = issue.match(/WEAK SECRET: (\w+)/);
      if (match) {
        fixes.push({
          type: 'suggestion',
          description: `Generate a strong ${match[1]} using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
        });
      }
    }
    
    // Missing env variable fixes
    if (issueLower.includes('missing:')) {
      const match = issue.match(/MISSING: (\w+)/);
      if (match) {
        fixes.push({
          type: 'suggestion',
          description: `Add ${match[1]} to your .env file`
        });
      }
    }
    
    // Security headers fixes
    if (issueLower.includes('security headers')) {
      fixes.push({
        type: 'suggestion',
        description: 'Install and configure Helmet.js: npm install helmet && app.use(require("helmet")())'
      });
    }
    
    // CORS fixes
    if (issueLower.includes('cors')) {
      fixes.push({
        type: 'suggestion',
        description: 'Install and configure CORS: npm install cors && app.use(require("cors")({ origin: process.env.ALLOWED_ORIGINS?.split(",") }))'
      });
    }
    
    // Rate limiting fixes
    if (issueLower.includes('rate limit')) {
      fixes.push({
        type: 'suggestion',
        description: 'Install express-rate-limit: npm install express-rate-limit && app.use(require("express-rate-limit")({ windowMs: 15 * 60 * 1000, max: 100 }))'
      });
    }
    
    // Health endpoint fixes
    if (issueLower.includes('health endpoint')) {
      fixes.push({
        type: 'suggestion',
        description: 'Add health endpoint: app.get("/health", (req, res) => res.json({ status: "ok", timestamp: Date.now() }))'
      });
    }
  });
  
  return fixes;
}

/**
 * Generate .env.example template
 */
function generateEnvExampleTemplate() {
  return `# Environment Variables
# Copy this file to .env and fill in your values

# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRY=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# API Keys (if needed)
# API_KEY=your-api-key
`;
}

/**
 * Generate README template
 */
function generateReadmeTemplate() {
  return `# Project Name

Brief description of your project.

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

Copy \`.env.example\` to \`.env\` and configure your environment variables.

\`\`\`bash
cp .env.example .env
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## API Endpoints

- \`GET /health\` - Health check endpoint

## License

MIT
`;
}

/**
 * Apply fixes (with user confirmation in real usage)
 */
async function applyFixes(fixes, projectPath, dryRun = true) {
  const results = [];
  
  for (const fix of fixes) {
    if (fix.type === 'create_file') {
      const filePath = path.join(projectPath, fix.file);
      const exists = await fileExists(filePath);
      
      if (exists && !dryRun) {
        results.push({
          fix,
          status: 'skipped',
          reason: 'File already exists'
        });
      } else if (dryRun) {
        results.push({
          fix,
          status: 'would_create',
          filePath
        });
      } else {
        await fs.writeFile(filePath, fix.content);
        results.push({
          fix,
          status: 'created',
          filePath
        });
      }
    } else if (fix.type === 'suggestion') {
      results.push({
        fix,
        status: 'suggestion',
        description: fix.description
      });
    }
  }
  
  return results;
}

module.exports = {
  generateFixes,
  applyFixes
};

