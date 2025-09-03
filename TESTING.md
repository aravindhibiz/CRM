# Testing Documentation

This project uses **Vitest** for unit and integration testing, and **Playwright** for end-to-end testing.

## Setup

All testing dependencies are already installed. To get started:

```bash
npm install
```

## Unit & Integration Tests (Vitest)

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Test files should be placed next to the code they test with the `.test.js` or `.spec.js` extension, or in `__tests__` directories.

Example test structure:
```
src/
  components/
    __tests__/
      Component.test.jsx
    Component.jsx
  services/
    __tests__/
      service.test.js
    service.js
```

### Test Utilities

Use the custom render function from `src/test/utils.jsx`:

```javascript
import { renderWithProviders, screen, userEvent } from '@/test/utils';
import MyComponent from '../MyComponent';

test('should render component', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mocking

Common mocks are set up in `src/test/setup.js`. For component-specific mocks:

```javascript
import { vi } from 'vitest';

vi.mock('../api/service', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mock data' }),
}));
```

## End-to-End Tests (Playwright)

### Running E2E Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Writing E2E Tests

Tests should be placed in the `e2e/` directory with `.spec.js` extension.

Use the custom fixtures for common setups:

```javascript
import { test, expect } from './fixtures';

test('should do something', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/some-page');
  await expect(authenticatedPage.locator('h1')).toBeVisible();
});
```

### Available Fixtures

- `authenticatedPage` - Page with user already logged in
- `dashboardPage` - Authenticated page navigated to dashboard
- `contactsPage` - Authenticated page navigated to contacts
- `dealsPage` - Authenticated page navigated to deals

### Test Data

Update the test credentials in `e2e/fixtures/index.js` for your test environment.

## Configuration

### Vitest Configuration

Located in `vitest.config.js`. Key settings:
- Uses jsdom environment for DOM testing
- Includes setup file for global mocks
- Configures coverage reporting

### Playwright Configuration

Located in `playwright.config.js`. Key settings:
- Tests against Chromium, Firefox, and WebKit
- Mobile device testing included
- Automatic dev server startup
- Video and screenshot capture on failure

## CI/CD

GitHub Actions workflow in `.github/workflows/test.yml` runs:
- Unit tests with coverage
- E2E tests on multiple browsers
- Artifact upload for test reports

## Best Practices

### Unit Tests
- Test behavior, not implementation
- Use descriptive test names
- Keep tests focused and isolated
- Mock external dependencies

### Integration Tests
- Test component interactions
- Verify API integrations
- Test state management

### E2E Tests
- Test critical user journeys
- Use page object pattern for complex pages
- Keep tests independent
- Use stable selectors (data-testid)

### Debugging

#### Unit Tests
```bash
# Debug specific test
npm run test -- --reporter=verbose ComponentName

# Run single test file
npm run test src/components/__tests__/Component.test.jsx
```

#### E2E Tests
```bash
# Debug mode with browser
npm run test:e2e:debug

# Run specific test
npx playwright test auth.spec.js

# Run with headed browser
npx playwright test --headed
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in your browser to view detailed coverage information.

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**: Check for timezone, environment variable, or timing issues
2. **Flaky E2E tests**: Add proper waits, use more stable selectors
3. **Mock not working**: Ensure mock is set up before the module is imported
4. **Coverage not accurate**: Check if files are being excluded in vitest config

### Getting Help

- Vitest docs: https://vitest.dev/
- Playwright docs: https://playwright.dev/
- Testing Library docs: https://testing-library.com/
