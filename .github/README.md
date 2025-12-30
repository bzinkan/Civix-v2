# GitHub Automation

This directory contains GitHub-specific automation and templates.

## Workflows (CI/CD)

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
1. **Lint and Type Check**
   - Runs ESLint
   - Runs TypeScript type checking

2. **Build**
   - Builds Next.js application
   - Validates production build

3. **Test**
   - Runs Jest tests
   - Currently allows failures until tests are fully implemented

**How to view:**
- Go to GitHub Actions tab in your repository
- See build status on pull requests
- Fix any failing checks before merging

### Deploy Workflow (`.github/workflows/deploy-replit.yml`)

Runs when code is pushed to `main` branch.

**Purpose:**
- Notifies that code is ready for deployment
- Provides deployment checklist
- Replit auto-deploys if connected to GitHub

## Issue Templates

### Bug Report (`.github/ISSUE_TEMPLATE/bug_report.md`)

Use when reporting bugs or unexpected behavior.

**Includes:**
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Rule information (if applicable)

### Feature Request (`.github/ISSUE_TEMPLATE/feature_request.md`)

Use when requesting new features or enhancements.

**Includes:**
- Feature description
- Use case
- Implementation ideas
- Category (rules, jurisdiction, UI, etc.)

## Pull Request Template

Located at `.github/PULL_REQUEST_TEMPLATE.md`

**Automatic checklist includes:**
- Type of change
- Testing performed
- Database changes
- Documentation updates

**Usage:**
Pull requests automatically populate with this template when created.

## Dependabot

Configuration: `.github/dependabot.yml`

**What it does:**
- Automatically checks for npm package updates weekly
- Checks for GitHub Actions updates monthly
- Opens PRs for dependency updates
- Limits to 5 open PRs at a time

**Benefits:**
- Keeps dependencies secure and up-to-date
- Automated security patches
- Version bump management

## CI/CD Best Practices

### Before Pushing

```bash
# Run checks locally first
npm run lint
npm run type-check
npm run build
npm test
```

### Branch Protection (Recommended)

Enable in GitHub repository settings:

1. Require pull request reviews
2. Require status checks to pass (CI workflow)
3. Require branches to be up to date
4. No force pushes to main

### Deployment Flow

```
Feature Branch → PR → CI Checks Pass → Review → Merge to Main → Auto-Deploy to Replit
```

## Setting Up CI/CD

### First Time Setup

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: initial project setup with CI/CD"
   git push origin main
   ```

2. **Enable GitHub Actions**
   - Actions are enabled by default
   - Check the "Actions" tab in your repo

3. **Connect Replit to GitHub** (optional)
   - In Replit: Settings → GitHub Integration
   - Select your repository
   - Replit will auto-deploy on push to main

### Viewing CI Results

- **On Pull Requests**: Status checks appear at the bottom
- **On Commits**: Green checkmark or red X next to commit
- **Actions Tab**: Full workflow logs and history

## Customizing Workflows

### Add More Checks

Edit `.github/workflows/ci.yml` to add:
- Code coverage requirements
- Security scanning
- Performance benchmarks
- Integration tests

### Environment Variables for CI

Add secrets in GitHub repository settings:
- Settings → Secrets and variables → Actions
- Add DATABASE_URL, STRIPE keys (for integration tests)

## Troubleshooting

### CI Failing on Type Check

```bash
# Fix locally first
npm run type-check
# Fix errors, then commit
```

### CI Failing on Build

```bash
# Test build locally
npm run build
# Fix build errors
```

### CI Failing on Lint

```bash
# Auto-fix lint errors
npm run lint -- --fix
# Or use Prettier
npm run format
```

## Status Badges

Add to README.md:

```markdown
![CI](https://github.com/bzinkan/Civix-v2/workflows/CI/badge.svg)
```

This shows build status at the top of your README.

## Future Enhancements

- [ ] Add code coverage reporting
- [ ] Add security scanning (Snyk, CodeQL)
- [ ] Add performance testing
- [ ] Add E2E tests with Playwright
- [ ] Add automatic deployments to AWS Fargate (Phase 2)
