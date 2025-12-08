# Playwright E2E Testing Guide

## Overview

This guide covers the Playwright implementation for EPIC.submit E2E testing. Playwright runs alongside Cypress as a comparison framework to help the team evaluate which testing tool to adopt.

## Quick Start

### Installation

Already done via `npm install -D @playwright/test dotenv`

### Configuration

1. **Copy environment template**:
   ```bash
   cp .env.playwright.template .env.playwright
   ```

2. **Fill in credentials** in `.env.playwright`:
   ```bash
   BASE_URL=http://localhost:5173
   STAFF_USERNAME=your-actual-username
   STAFF_PASSWORD=your-actual-password
   # ... etc
   ```

3. **Install browsers** (first time only):
   ```bash
   npx playwright install chromium
   ```

### Running Tests

**Interactive mode** (with UI):
```bash
npx playwright test --ui
```

**Headed mode** (see browser):
```bash
npx playwright test --headed
```

**Headless mode** (default):
```bash
npx playwright test
```

**Specific test**:
```bash
npx playwright test proponent-bcsc-ui-login
```

**Debug mode**:
```bash
npx playwright test --debug
```

**View last test report**:
```bash
npx playwright show-report
```

## Architecture

### File Structure

```
submit-web/
├── playwright/
│   ├── e2e/
│   │   ├── staff-login.spec.ts              # ROPC: Staff login
│   │   ├── proponent-login.spec.ts          # ROPC: Proponent login
│   │   ├── proponent-bcsc-ui-login.spec.ts  # UI: BCSC login
│   │   └── proponent-bceid-ui-login.spec.ts # UI: BCeID login (skipped)
│   └── auth.ts                              # Auth helper functions
├── playwright.config.ts                     # Playwright configuration
├── .env.playwright                          # Test credentials (gitignored)
└── .env.playwright.template                 # Template for credentials
```

### Configuration

**File**: `playwright.config.ts`

Key settings:
- `testDir`: `./playwright/e2e`
- `timeout`: 60s (for OAuth flows)
- `baseURL`: From `process.env.BASE_URL` or defaults to `http://localhost:5173`
- `retries`: 2 in CI, 0 locally
- `video`: Retained on failure
- `screenshot`: Only on failure
- Browser: Chromium (configurable)

### Environment Variables

**File**: `.env.playwright` (gitignored)

```bash
BASE_URL=http://localhost:5173
STAFF_USERNAME=your-staff-username
STAFF_PASSWORD=your-staff-password
PROPONENT_USERNAME=your-proponent-username
PROPONENT_PASSWORD=your-proponent-password
PROPONENT_BCSC_USERNAME=your-bcsc-test-username
PROPONENT_BCSC_PASSWORD=your-bcsc-test-password
PROPONENT_BCEID_USERNAME=your-bceid-test-username
PROPONENT_BCEID_PASSWORD=your-bceid-test-password
```

## Authentication Flows

### 1. ROPC (Resource Owner Password Credentials) Flow

**Function**: `kcLogin(page, username, password)`

**How it works**:
1. POST to Keycloak token endpoint
2. Receive `access_token`, `id_token`, `refresh_token`
3. Inject tokens into `sessionStorage` via `page.addInitScript()`
4. Navigate to app (authenticated)

**Example**:
```typescript
import { kcLogin } from '../auth';

test('staff login', async ({ page }) => {
  await kcLogin(page, 'username', 'password');
  await page.goto('/');
  // Now authenticated
});
```

**Pros**:
- ✅ Fast and reliable
- ✅ No UI interaction needed
- ✅ Ideal for test setup

**Cons**:
- ❌ Doesn't test actual login UI
- ❌ Bypasses identity provider pages

### 2. BCSC UI Login Flow

**Function**: `loginViaBCSC(page, username, password)`

**Flow**:
1. Click "Login" → "BC Services Card"
2. Click "Test with username and password"
3. Fill credentials
4. Accept terms and continue
5. Wait for OAuth callback
6. Verify routing to dashboard

**Example**:
```typescript
import { loginViaBCSC } from '../auth';

test('BCSC login', async ({ page }) => {
  await loginViaBCSC(page, 'username', 'password');
  // Now on dashboard
});
```

**Pros**:
- ✅ Tests actual user experience
- ✅ Validates full auth flow
- ✅ No `cy.origin()` complexity (Playwright handles cross-origin natively)

### 3. BCeID UI Login Flow

**Function**: `loginViaBCeID(page, username, password)`

Similar to BCSC but simpler flow (currently skipped).

## Playwright vs Cypress

### Key Differences

| Feature | Playwright | Cypress |
|---------|-----------|---------|
| **Cross-origin** | Native support, seamless | Requires `cy.origin()` or `chromeWebSecurity: false` |
| **Speed** | Generally faster | Slightly slower |
| **API** | `page.locator()`, `expect()` | `cy.get()`, `.should()` |
| **Waiting** | Auto-waiting built-in | Auto-waiting built-in |
| **Browser support** | Chromium, Firefox, WebKit | Chrome, Firefox, Edge, Electron |
| **Debugging** | Excellent inspector/trace viewer | Good time-travel debugging |
| **Parallelization** | Built-in, easy to configure | Requires Cypress Dashboard (paid) or custom setup |
| **Test isolation** | Each test gets fresh context | Configurable |
| **Retries** | Built-in at test level | Built-in at test level |

### Example Comparison

**Cypress**:
```typescript
cy.visit('/');
cy.get('button').contains('Login').click();
cy.get('#username').type('user');
cy.url().should('include', '/dashboard');
```

**Playwright**:
```typescript
await page.goto('/');
await page.getByRole('button', { name: 'Login' }).click();
await page.locator('#username').fill('user');
await expect(page).toHaveURL(/\/dashboard/);
```

## Test Patterns

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.goto('/');
    await expect(page.getByText('Hello')).toBeVisible();
  });
});
```

### Skipping Tests

```typescript
test.describe.skip('Disabled Feature', () => {
  // These tests won't run
});

test.skip('individual test', async ({ page }) => {
  // This test won't run
});
```

### Debugging

```typescript
test('debug this', async ({ page }) => {
  await page.pause(); // Opens Playwright Inspector
  // Or use --debug flag when running
});
```

## CI/CD

### GitHub Actions Workflow

**File**: `.github/workflows/e2e-playwright.yml`

**Trigger**: Manual dispatch

**Steps**:
1. Install dependencies
2. Install Playwright browsers
3. Create `.env.playwright` from secrets
4. Run tests
5. Upload artifacts (reports, videos, screenshots)

**Required Secrets** (same as Cypress):
- `CYPRESS_STAFF_USERNAME`
- `CYPRESS_STAFF_PASSWORD`
- `CYPRESS_PROPONENT_USERNAME`
- `CYPRESS_PROPONENT_PASSWORD`
- `CYPRESS_PROPONENT_BCSC_USERNAME`
- `CYPRESS_PROPONENT_BCSC_PASSWORD`
- `CYPRESS_PROPONENT_BCEID_USERNAME`
- `CYPRESS_PROPONENT_BCEID_PASSWORD`

## Running Against Dev Environment

### Option 1: Update `.env.playwright`
```bash
BASE_URL=https://submit-web-c8b80a-dev.apps.gold.devops.gov.bc.ca
```

### Option 2: Command line override
```bash
BASE_URL=https://submit-web-c8b80a-dev.apps.gold.devops.gov.bc.ca npx playwright test
```

## Debugging Tips

### 1. Use Playwright Inspector
```bash
npx playwright test --debug
```

### 2. View Trace
```bash
npx playwright show-trace test-results/.../trace.zip
```

### 3. Headed Mode
```bash
npx playwright test --headed --slowmo=1000
```

### 4. Check Test Report
```bash
npx playwright show-report
```

### 5. Screenshot on Failure
Automatically captured in `test-results/`

## Common Issues

### Issue 1: Browser Not Installed

**Error**: `Executable doesn't exist at ...`

**Solution**:
```bash
npx playwright install chromium
```

### Issue 2: Environment Variables Not Loaded

**Error**: Tests fail with empty credentials

**Solution**: Ensure `.env.playwright` exists and has correct values

### Issue 3: BCSC Login Fails

**Cause**: BCSC flow changed or selectors outdated

**Debug**:
```bash
npx playwright test proponent-bcsc-ui-login --headed --debug
```

## Next Steps

After the team demo, choose one framework and remove the other:

**If choosing Playwright**:
- Remove `cypress/` directory
- Remove `cypress.config.cjs`
- Remove `cypress.env.json`
- Remove `.github/workflows/e2e.yml`
- Update documentation

**If choosing Cypress**:
- Remove `playwright/` directory
- Remove `playwright.config.ts`
- Remove `.env.playwright`
- Remove `.github/workflows/e2e-playwright.yml`
- Update documentation

## Resources

- **Playwright Docs**: https://playwright.dev
- **Playwright Best Practices**: https://playwright.dev/docs/best-practices
- **Playwright VS Code Extension**: Recommended for debugging
- **Trace Viewer**: https://trace.playwright.dev

---

**Last Updated**: December 2024
**Status**: Demo/Comparison implementation
**Test Coverage**: Authentication flows (ROPC + UI)
