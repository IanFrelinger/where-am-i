# 🚀 CI/CD Integration with Playwright Tests

This document describes the CI/CD pipeline integration for the Where Am I application, including comprehensive Playwright test automation.

## 📋 Overview

The CI/CD pipeline now includes:
- **Automated Playwright testing** on every push and pull request
- **Comprehensive test coverage** including smoke, map, E2E, and debug tests
- **Test result reporting** with detailed artifacts and PR comments
- **Multi-environment deployment** support
- **Security scanning** and vulnerability assessment

## 🔄 Workflow Files

### 1. Main Deployment Workflow (`.github/workflows/deploy.yml`)
- **Triggers**: Push to `main`/`master`, Pull requests
- **Jobs**: Test → Docker Build → Build → Deploy → Deploy Containers
- **Features**: Full application deployment with infrastructure as code

### 2. Production Deployment (`.github/workflows/deploy-production.yml`)
- **Triggers**: Push to `main`/`master`, Manual dispatch
- **Jobs**: Test → Security Scan → Deploy Infrastructure
- **Features**: Production-grade deployment with security scanning

### 3. Docker Build & Test (`.github/workflows/docker-build.yml`)
- **Triggers**: Changes to packages, Dockerfiles, docker-compose
- **Jobs**: Build and test Docker containers
- **Features**: Container testing and security scanning

### 4. Playwright Tests (`.github/workflows/playwright.yml`) ⭐ **NEW**
- **Triggers**: Push to `main`/`master`/`develop`, Pull requests, Manual dispatch
- **Jobs**: Comprehensive Playwright testing
- **Features**: Test suite selection, detailed reporting, PR comments

## 🧪 Playwright Test Integration

### Test Suites
- **Smoke Tests**: Basic page loading and asset verification
- **Map Tests**: Map functionality and interactions
- **E2E Tests**: Complete user journey testing
- **Debug Tests**: Diagnostic and troubleshooting tests

### CI/CD Features
- **Automatic browser installation** (Chromium)
- **Development server startup** for realistic testing
- **Test result artifacts** with 30-day retention
- **PR comments** with test summary and success rates
- **Configurable test suites** via manual dispatch

## 🚀 Deployment Process

### 1. Test Phase
```yaml
- Install dependencies and Playwright browsers
- Start development server
- Run comprehensive Playwright tests
- Upload test results and reports
- Comment PR with test summary
```

### 2. Build Phase
```yaml
- Build frontend and backend applications
- Create Docker images
- Run security scans
- Upload build artifacts
```

### 3. Deploy Phase
```yaml
- Deploy AWS infrastructure via CDK
- Upload frontend to S3
- Configure CloudFront distribution
- Deploy containers to ECS (optional)
```

## 📊 Test Results & Reporting

### Artifacts Generated
- `playwright-results-{run_number}`: Test execution results
- `playwright-report-{run_number}`: HTML test reports
- `build-artifacts`: Application builds
- `trivy-results.sarif`: Security scan results

### PR Comments
Automated comments include:
- Test suite executed
- Total tests run
- Pass/fail counts
- Success rate percentage
- Links to detailed reports

## 🛠️ Manual Testing

### Run Specific Test Suites
```bash
# Via GitHub Actions UI
1. Go to Actions → Playwright Tests
2. Click "Run workflow"
3. Select test suite: smoke, map, e2e, debug, or all
4. Click "Run workflow"

# Via GitHub CLI
gh workflow run "🧪 Playwright Tests" -f test_suite=smoke
```

### Local Testing
```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm test:playwright:install

# Run specific test suites
pnpm test:playwright:smoke
pnpm test:playwright:map
pnpm test:playwright:e2e
pnpm test:playwright tests/debug-*.spec.ts

# Run all tests
pnpm test:playwright
```

## 🔧 Configuration

### Environment Variables
- `NODE_VERSION`: Node.js version (default: 20)
- `AWS_ACCESS_KEY_ID`: AWS credentials for deployment
- `AWS_SECRET_ACCESS_KEY`: AWS credentials for deployment
- `AWS_REGION`: AWS region for deployment
- `DOMAIN_NAME`: Custom domain for production
- `API_SUBDOMAIN`: API subdomain for production

### Secrets Required
- `GITHUB_TOKEN`: GitHub API access
- `AWS_ACCESS_KEY_ID`: AWS deployment access
- `AWS_SECRET_ACCESS_KEY`: AWS deployment access
- `ECR_REPOSITORY_URI`: ECR repository (optional)
- `ECS_CLUSTER`: ECS cluster name (optional)
- `ECS_SERVICE`: ECS service name (optional)

## 📈 Monitoring & Metrics

### Test Metrics
- **Test Execution Time**: Tracked per workflow run
- **Success Rates**: Automated calculation and reporting
- **Failure Analysis**: Detailed logs and screenshots
- **Performance Trends**: Historical test data

### Deployment Metrics
- **Build Times**: Docker and application build durations
- **Deployment Success**: Infrastructure and application deployment rates
- **Security Issues**: Vulnerability scan results
- **Resource Usage**: AWS resource consumption

## 🚨 Troubleshooting

### Common Issues

#### Tests Failing in CI
```bash
# Check test results
1. Go to Actions → Playwright Tests
2. Download test-results artifact
3. Review screenshots and videos
4. Check console logs for errors
```

#### Development Server Not Starting
```bash
# Verify dependencies
pnpm install
pnpm test:playwright:install

# Check port conflicts
lsof -i :5173
lsof -i :8787
```

#### Browser Installation Issues
```bash
# Clear Playwright cache
rm -rf ~/.cache/ms-playwright

# Reinstall browsers
pnpm test:playwright:install
```

### Debug Mode
```bash
# Run tests with debug output
pnpm test:playwright:debug

# Run with UI mode
pnpm test:playwright:ui

# Run with headed browser
pnpm test:playwright:headed
```

## 🔄 Continuous Improvement

### Best Practices
1. **Test Coverage**: Aim for >90% test coverage
2. **Fast Feedback**: Keep test execution under 10 minutes
3. **Reliable Tests**: Minimize flaky tests with proper waits
4. **Clear Reports**: Ensure test failures are actionable

### Future Enhancements
- [ ] Parallel test execution across multiple browsers
- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Cross-browser compatibility testing
- [ ] Mobile device testing

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: Development Team
