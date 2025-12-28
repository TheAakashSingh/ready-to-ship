# 🚀 Ready-to-Ship CLI

**Validate a backend project before deployment like a senior engineer would.**

[![npm version](https://img.shields.io/npm/v/ready-to-ship)](https://www.npmjs.com/package/ready-to-ship)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **The only CLI that combines environment, auth, API, security, dependencies, and database validation in one tool.**

## ✨ Features

- ✅ **Environment Validation** - Check `.env` files, missing variables, weak secrets, type validation
- 🔐 **Auth Validation** - Detect unprotected routes, JWT configuration, middleware checks
- 🌐 **API Validation** - Health endpoints, route consistency, HTTP method patterns
- 📁 **Project Validation** - Structure, README, error handling, best practices
- 🔒 **Security Validation** - CORS, security headers, rate limiting, vulnerability detection
- 📦 **Dependencies Validation** - Package health, lock files, outdated packages
- 🗄️ **Database Validation** - Connection handling, pooling, migration files
- 🔧 **Auto-Fix Suggestions** - Get actionable fixes for common issues
- 📊 **Comprehensive Reports** - Combined verdict with detailed insights
- 🎯 **CI/CD Ready** - GitHub Actions templates included

## Installation

```bash
npm install -g ready-to-ship
```

Or use with npx (no installation needed):

```bash
npx ready-to-ship <command>
```

## Usage

### Individual Checks

```bash
# Check environment variables
npx ready-to-ship env

# Check authentication & route protection
npx ready-to-ship auth

# Check API endpoints
npx ready-to-ship api

# Check project structure
npx ready-to-ship project

# Check security configurations
npx ready-to-ship security

# Check dependencies
npx ready-to-ship dependencies

# Check database configuration
npx ready-to-ship database
```

### Auto-Fix

```bash
# Get fix suggestions
npx ready-to-ship fix

# Apply fixes automatically (creates files)
npx ready-to-ship fix --apply
```

### Full Report

```bash
# Generate comprehensive report
npx ready-to-ship report

# With verbose output
npx ready-to-ship report --verbose

# Export to JSON
npx ready-to-ship report --json
```

### Options

- `-p, --path <path>` - Specify project path (default: current directory)
- `--json` - Export results to JSON (report command only)
- `--verbose` - Show detailed logs (report command only)

## What It Checks

### 🔹 ENV Module
- Missing environment variables (compared to `.env.example`)
- Weak secrets (short JWT_SECRET, etc.)
- Unused variables
- Type validation (URL, email, number)

### 🔹 AUTH Module
- Unprotected sensitive routes
- Missing auth middleware
- JWT expiry configuration
- Route protection patterns

### 🔹 API Module
- Health endpoint presence
- Route consistency
- HTTP method patterns
- RESTful API best practices

### 🔹 PROJECT Module
- `.env.example` existence
- README presence and quality
- Project structure
- Error handling middleware

### 🔹 SECURITY Module
- CORS configuration
- Security headers (Helmet.js)
- Rate limiting
- Common security anti-patterns
- eval() usage detection

### 🔹 DEPENDENCIES Module
- Lock file presence
- Outdated packages
- Security package recommendations
- Dependency count analysis

### 🔹 DATABASE Module
- Database connection configuration
- Connection error handling
- Connection pooling
- Migration files
- Database type detection

## Example Output

```
========================
READY-TO-SHIP REPORT
========================

ENV:     ✅ PASS
AUTH:    ❌ FAIL
API:     ✅ PASS
PROJECT: ❌ FAIL

FINAL VERDICT: ❌ NOT READY
```

## 🎯 Why Ready-to-Ship?

**Most validation tools only check one thing.** Ready-to-Ship is the **only CLI** that combines:
- ✅ Environment validation
- ✅ Security checks
- ✅ Auth validation
- ✅ API health
- ✅ Dependencies analysis
- ✅ Database configuration
- ✅ Auto-fix suggestions

**All in one command.** Save hours of manual review before every deployment.

## 🚀 CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Ready-to-Ship
  run: npx ready-to-ship report --json
```

See `templates/.github/workflows/ready-to-ship.yml` for a complete example.

## 📈 Roadmap

- [ ] OpenAPI/Swagger spec validation
- [ ] Docker/container readiness checks
- [ ] Performance hints
- [ ] Logging setup validation
- [ ] VSCode extension
- [ ] Slack/Discord webhook integration

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT

## ⭐ Star History

If you find this tool useful, please consider giving it a star on GitHub!

