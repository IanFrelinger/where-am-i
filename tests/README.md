# Playwright Test Suite for where-am-i

This directory contains comprehensive automated tests for the where-am-i application using Playwright.

## 🧪 Test Overview

### Test Categories

1. **Smoke Tests** (`smoke.spec.ts`)
   - Basic page loading and accessibility
   - Asset loading verification (CSS, JavaScript)
   - Console error checking
   - HTTP status code validation

2. **Map Functionality Tests** (`map.spec.ts`)
   - Map container visibility and dimensions
   - Mapbox GL JS initialization
   - Map tile loading and display
   - Map controls and interactions
   - Responsive design testing

3. **End-to-End Tests** (`e2e.spec.ts`)
   - Complete user journey simulation
   - Page refresh and navigation handling
   - Network interruption resilience
   - State persistence during interactions
   - Multi-viewport compatibility

## 🚀 Running Tests

### Prerequisites

1. **Install Playwright browsers** (first time only):
   ```bash
   pnpm test:playwright:install
   # or
   npx playwright install
   ```

2. **Ensure the application is deployed** and accessible at the configured base URL

### Quick Start

```bash
# Run all tests on all browsers
pnpm test:playwright

# Run specific test categories
pnpm test:playwright:smoke      # Smoke tests only
pnpm test:playwright:map        # Map tests only
pnpm test:playwright:e2e        # E2E tests only
pnpm test:playwright:quick      # Smoke + Map tests

# Interactive testing
pnpm test:playwright:ui         # Open Playwright UI
pnpm test:playwright:debug      # Debug mode (headed)
pnpm test:playwright:headed     # Run tests in headed mode
```

### Using the Test Runner Script

```bash
# Make script executable (first time only)
chmod +x tests/run-tests.sh

# Run different test configurations
./tests/run-tests.sh                    # All tests on all browsers
./tests/run-tests.sh smoke              # Smoke tests only
./tests/run-tests.sh map                # Map tests only
./tests/run-tests.sh e2e                # E2E tests only
./tests/run-tests.sh quick              # Quick test suite
./tests/run-tests.sh browser firefox    # All tests on Firefox
./tests/run-tests.sh parallel           # All tests in parallel
./tests/run-tests.sh debug              # Debug mode
./tests/run-tests.sh ui                 # Open Playwright UI
./tests/run-tests.sh help               # Show help
```

### Direct Playwright Commands

```bash
# Run specific test files
npx playwright test tests/smoke.spec.ts
npx playwright test tests/map.spec.ts
npx playwright test tests/e2e.spec.ts

# Run on specific browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run with specific reporters
npx playwright test --reporter=html,line
npx playwright test --reporter=json
npx playwright test --reporter=junit

# Run with specific workers
npx playwright test --workers=1          # Sequential execution
npx playwright test --workers=4          # Parallel execution
```

## 📊 Test Results and Reports

### Generated Reports

- **HTML Report**: `playwright-report/index.html` - Interactive test results
- **JSON Results**: `test-results/results.json` - Machine-readable results
- **JUnit Results**: `test-results/results.xml` - CI/CD integration
- **Screenshots**: `test-results/` - Failed test screenshots
- **Videos**: `test-results/` - Failed test recordings
- **Traces**: `test-results/` - Test execution traces

### Viewing Results

```bash
# Open HTML report
npx playwright show-report

# Open specific report
open playwright-report/index.html
open test-results/index.html
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

- **Base URL**: `https://d1pxtwdttqrk2p.cloudfront.net`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Headless Mode**: Enabled by default (faster execution)
- **Parallel Execution**: Enabled by default
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: On failure only
- **Traces**: On first retry

### Environment Variables

```bash
# Run tests against different environments
BASE_URL=https://localhost:3000 pnpm test:playwright
BASE_URL=https://staging.example.com pnpm test:playwright
BASE_URL=https://production.example.com pnpm test:playwright
```

## 🐛 Debugging Tests

### Running Modes

#### Headless Mode (Default)
```bash
# Run tests in headless mode (faster, no browser UI)
pnpm test:playwright
# or
npx playwright test
```

#### Headed Mode
```bash
# Run tests with visible browser
pnpm test:playwright:headed
# or
npx playwright test --headed
```

#### Debug Mode
```bash
# Run tests in debug mode (headed with debugging tools)
pnpm test:playwright:debug
# or
npx playwright test --debug
```

### Playwright UI

```bash
# Open interactive UI
pnpm test:playwright:ui
# or
npx playwright test --ui
```

### Debugging Tips

1. **Use `page.pause()`** in test code to pause execution
2. **Check console logs** for detailed error information
3. **Review screenshots and videos** for visual debugging
4. **Use `--headed` flag** to see browser during test execution
5. **Enable traces** for detailed execution flow

## 📱 Browser Support

### Desktop Browsers
- **Chromium**: Full support, primary testing browser
- **Firefox**: Full support, secondary testing browser
- **WebKit**: Full support, Safari compatibility

### Mobile Browsers
- **Mobile Chrome**: Pixel 5 viewport
- **Mobile Safari**: iPhone 12 viewport

### Viewport Sizes Tested
- Desktop: 1920x1080
- Tablet: 1024x768
- Mobile: 375x667
- Small Mobile: 320x568

## 🚨 Common Issues and Solutions

### Map Not Loading
- Verify CloudFront distribution is accessible
- Check that CSS and JavaScript assets are loading
- Ensure Mapbox GL JS is properly initialized

### Test Failures
- Check network connectivity to the application
- Verify the application is deployed and running
- Review console errors and network requests
- Check viewport sizes and responsive behavior

### Performance Issues
- Reduce parallel workers: `--workers=1`
- Increase timeouts for slow operations
- Use specific browser projects instead of all browsers

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
- name: Run Playwright Tests
  run: |
    pnpm test:playwright:install
    pnpm test:playwright --reporter=junit
  env:
    BASE_URL: ${{ secrets.BASE_URL }}
```

### CI/CD Integration

- **JUnit Reports**: `test-results/results.xml`
- **JSON Results**: `test-results/results.json`
- **Artifacts**: Screenshots, videos, traces
- **Exit Codes**: Proper failure reporting

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)

## 🤝 Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Add appropriate timeouts for async operations
3. Include both positive and negative test cases
4. Test across different viewport sizes
5. Add descriptive test names and comments
6. Update this README if adding new test categories

## 📝 Test Maintenance

### Regular Tasks
- Update browser versions quarterly
- Review and update timeouts as needed
- Monitor test flakiness and adjust accordingly
- Update test data and expected values

### Performance Monitoring
- Track test execution times
- Monitor resource usage during tests
- Optimize slow-running tests
- Balance test coverage vs. execution speed
