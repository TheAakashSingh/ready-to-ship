# 🚀 Quick Start Guide

## Installation

```bash
npm install -g ready-to-ship
```

Or use with npx (no installation needed):

```bash
npx ready-to-ship report
```

## First Run

Navigate to your backend project and run:

```bash
npx ready-to-ship report
```

This will run all checks and give you a comprehensive report.

## Common Commands

```bash
# Full report (recommended)
npx ready-to-ship report

# Individual checks
npx ready-to-ship env
npx ready-to-ship auth
npx ready-to-ship security

# Get auto-fix suggestions
npx ready-to-ship fix

# Apply fixes automatically
npx ready-to-ship fix --apply
```

## CI/CD Integration

Copy the GitHub Actions template:

```bash
mkdir -p .github/workflows
cp templates/.github/workflows/ready-to-ship.yml .github/workflows/
```

## What Makes This Unique?

✅ **All-in-One** - No need to run 5+ different tools
✅ **Auto-Fix** - Get actionable suggestions, not just warnings
✅ **Zero Config** - Works out of the box on any Node.js project
✅ **CI/CD Ready** - Templates included for GitHub Actions
✅ **Comprehensive** - 7 validation modules in one tool

## Next Steps

1. Run `npx ready-to-ship report` on your project
2. Review the issues and warnings
3. Use `npx ready-to-ship fix` to get suggestions
4. Add to your CI/CD pipeline
5. Share with your team!

## Support

Found a bug? Have a feature request? Open an issue on GitHub!

