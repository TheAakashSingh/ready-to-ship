# Templates

This directory contains ready-to-use templates for CI/CD integration.

## GitHub Actions

Copy `github-actions.yml` to `.github/workflows/ready-to-ship.yml` in your project:

```bash
mkdir -p .github/workflows
cp templates/github-actions.yml .github/workflows/ready-to-ship.yml
```

This will automatically run Ready-to-Ship validation on every push and PR.

## Customization

You can customize the workflow to:
- Run only on specific branches
- Add notifications (Slack, email)
- Upload reports as artifacts
- Block merges if validation fails

