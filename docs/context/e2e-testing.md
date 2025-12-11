# EPIC.submit E2E Testing Context

## Overview

EPIC.submit uses **Playwright** for end-to-end (E2E) testing to validate authentication flows and critical user journeys. The testing strategy focuses on establishing a "beachhead" of core functionality tests that can be expanded over time.

## Testing Framework

**Playwright v13.13.0+**
- Modern, fast, and reliable E2E testing framework
- Native cross-origin support (critical for OAuth flows)
- Built-in parallelization and retries
- Excellent debugging tools (trace viewer, inspector)
- Supports Chromium, Firefox, and WebKit

## Test Architecture

### Directory Structure

```
submit-web/
├── playwright/
│   ├── e2e/                              # E2E test files
│   │   ├── staff-login.spec.ts           # Staff ROPC login test
│   │   ├── proponent-login.spec.ts       # Proponent ROPC login test
│   │   ├── proponent-bcsc-ui-login.spec.ts   # BCSC UI flow test
│   │   └── proponent-bceid-ui-login.spec.ts  # BCeID UI flow test (skipped)
│   ├── auth.ts                           # Authentication helper functions
│   ├── PLAYWRIGHT_TESTING_GUIDE.md       # Detailed testing guide
│   └── README.md                         # Quick reference
├── playwright.config.ts                  # Playwright configuration
├── .env.playwright                       # Test credentials (gitignored)
└── .env.playwright.template              # Credential template
```

### Configuration

**File**: `playwright.config.ts`

Key settings:
- **Test directory**: `./playwright/e2e`
- **Timeout**: 60 seconds (accommodates OAuth flows)
- **Base URL**: Configurable via `BASE_URL` environment variable
- **Retries**: 2 in CI, 0 locally
- **Artifacts**: Screenshots on failure, video on retry, trace on first retry
- **Browser**: Chromium (default), configurable for Firefox/WebKit
- **Parallelization**: Enabled by default

### Environment Configuration

**File**: `.env.playwright` (gitignored)

Required variables:
```bash
# Base URL for testing
BASE_URL=http://localhost:5173  # or deployed environment URL

# Staff credentials (ROPC flow)
STAFF_USERNAME=your-staff-username
STAFF_PASSWORD=your-staff-password

# Proponent credentials (ROPC flow)
PROPONENT_USERNAME=your-proponent-username
PROPONENT_PASSWORD=your-proponent-password

# BCSC test credentials (UI flow)
PROPONENT_BCSC_USERNAME=your-bcsc-test-username
PROPONENT_BCSC_PASSWORD=your-bcsc-test-password

# BCeID test credentials (UI flow)
PROPONENT_BCEID_USERNAME=your-bceid-test-username
PROPONENT_BCEID_PASSWORD=your-bceid-test-password
```

## Authentication Flows

### 1. ROPC (Resource Owner Password Credentials) Flow

**Purpose**: Fast, reliable token-based authentication for test setup/teardown

**How it works**:
1. POST to Keycloak token endpoint with username/password
2. Receive `access_token`, `id_token`, `refresh_token`
3. Inject tokens into `sessionStorage` via `page.addInitScript()`
4. Navigate to app (already authenticated)

**Function**: `kcLogin(page, username, password)`

**Pros**:
- ✅ Fast execution (no UI interaction)
- ✅ Reliable (no external UI dependencies)
- ✅ Ideal for test setup and data seeding

**Cons**:
- ❌ Doesn't validate actual login UI
- ❌ Bypasses identity provider flows

**Example**:
```typescript
import { kcLogin } from '../auth';

test('staff can access dashboard', async ({ page }) => {
  await kcLogin(page, process.env.STAFF_USERNAME!, process.env.STAFF_PASSWORD!);
  await page.goto('/');

  await expect(page.getByText('Projects')).toBeVisible();
  await expect(page).toHaveURL(/\/staff/);
});
```

### 2. BCSC (BC Services Card) UI Flow

**Purpose**: Validate full browser-based authentication through BC Services Card

**Flow**:
1. Navigate to app and click "Login"
2. Select "BC Services Card"
3. Click "Test with username and password" (test environment)
4. Fill credentials on BCSC login page
5. Accept terms and conditions
6. Wait for OAuth callback at `/oidc-callback`
7. Verify routing to dashboard

**Function**: `loginViaBCSC(page, username, password)`

**Key Implementation Details**:
- Uses `waitUntil: "networkidle"` to ensure page is fully loaded
- Waits for network idle after OAuth callback (critical for API calls)
- Validates no redirection to error page
- Native cross-origin handling (no special configuration needed)

**Pros**:
- ✅ Tests actual user experience
- ✅ Validates identity provider integration
- ✅ Catches UI/UX issues
- ✅ No cross-origin workarounds needed (Playwright handles natively)

**Cons**:
- ❌ Slower than ROPC
- ❌ Dependent on external IdP availability
- ❌ More fragile (external UI changes can break tests)

### 3. BCeID (Business BCeID) UI Flow

**Purpose**: Validate authentication through Business BCeID

**Status**: Currently skipped (test exists but not enabled)

**Function**: `loginViaBCeID(page, username, password)`

Similar to BCSC flow but simpler (no intermediate consent page).

## Running Tests

### Local Development

**Prerequisites**:
1. Frontend dev server running: `npm run dev` (or deployed environment)
2. Backend API running: `http://localhost:3200` (or configure `VITE_API_URL`)
3. Test credentials configured in `.env.playwright`
4. Playwright browsers installed: `npx playwright install chromium`

**Interactive UI Mode** (recommended for development):
```bash
npm run test:ui
# or
npx playwright test --ui
```

**Headed Mode** (see browser):
```bash
npm run test:headed
# or
npx playwright test --headed
```

**Headless Mode** (default):
```bash
npm test
# or
npx playwright test
```

**Specific Test**:
```bash
npx playwright test proponent-bcsc-ui-login
```

**Debug Mode**:
```bash
npm run test:debug
# or
npx playwright test --debug
```

**View Last Report**:
```bash
npm run test:report
# or
npx playwright show-report
```

### CI/CD Execution

**Workflow**: `.github/workflows/e2e.yml`

**Trigger**: Manual dispatch (`workflow_dispatch`)

**Environment**: Tests against dev environment URL

**Steps**:
1. Install dependencies
2. Install Playwright browsers (`chromium` only for CI)
3. Create `.env.playwright` from GitHub secrets
4. Run tests headless
5. Upload artifacts (HTML report, test results, traces)

**Required GitHub Secrets**:
- `CYPRESS_STAFF_USERNAME` (reused from Cypress migration)
- `CYPRESS_STAFF_PASSWORD`
- `CYPRESS_PROPONENT_USERNAME`
- `CYPRESS_PROPONENT_PASSWORD`
- `CYPRESS_PROPONENT_BCSC_USERNAME`
- `CYPRESS_PROPONENT_BCSC_PASSWORD`
- `CYPRESS_PROPONENT_BCEID_USERNAME`
- `CYPRESS_PROPONENT_BCEID_PASSWORD`

**Artifacts**:
- Playwright HTML report (interactive, browsable test results)
- Test results (raw test output)
- Traces (for failed tests, viewable in trace viewer)

## Test Environment Requirements

### Frontend

- **Dev Server**: Must be running on configured `BASE_URL`
- **OIDC Config**: Keycloak at `https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic`
- **Client ID**: `epic-submit`
- **Environment Variables**: Must be configured in `.env` file

### Backend

- **API URL**: Must be accessible at `VITE_API_URL` (from frontend `.env`)
- **Endpoints Required**:
  - `/api/users/me` - User provisioning
  - `/api/users/guid/{guid}` - User lookup
  - `/api/projects/accounts/{id}` - Project data
- **CORS**: Must allow requests from frontend origin

### External Services

- **Keycloak**: `https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic`
- **BCSC Test Environment**: `https://idtest.gov.bc.ca`
- **BCeID Dev Environment**: `https://dev.loginproxy.gov.bc.ca`

## Test Database Setup

**Script**: `submit-api/scripts/create_e2e_test_users.sql`

Creates test users in the database:
- Staff test user
- Proponent test user

**Important**: Update GUIDs in the script to match actual Keycloak user GUIDs before running.

## Common Issues and Solutions

### Issue 1: ERR_CONNECTION_REFUSED to API

**Symptoms**:
- Tests redirect to `/error` page
- Console shows connection refused errors
- API logs show successful requests (race condition)

**Causes**:
- Backend API not fully initialized when frontend makes first request
- Connection pool limits
- Network timing issues

**Solutions**:
1. **Wait for network idle** (already implemented in auth helpers)
   ```typescript
   await page.goto('/', { waitUntil: 'networkidle' });
   ```

2. **Ensure backend is running** before tests:
   ```bash
   curl http://localhost:3200/api/health
   ```

3. **Check API URL configuration** in frontend `.env`:
   ```bash
   VITE_API_URL=http://127.0.0.1:3200/api
   ```

### Issue 2: SecurityError on sessionStorage

**Symptoms**: `SecurityError: Failed to read the 'sessionStorage' property`

**Cause**: Trying to access `sessionStorage` before page has navigated to valid origin

**Solution**: Already fixed in `kcLogout()` function with try-catch wrapper

### Issue 3: Strict Mode Violation - Multiple Elements

**Symptoms**: `Error: strict mode violation: getByRole() resolved to 4 elements`

**Cause**: Multiple "Login" buttons on page (desktop + mobile, header + footer, etc.)

**Solution**: Use `.first()` to select the first matching element:
```typescript
await page.getByRole('button', { name: 'Login' }).first().click();
```

### Issue 4: Test Fails After OAuth Callback

**Symptoms**: Test times out or fails after `/oidc-callback`

**Causes**:
- User data API calls failing
- Token not properly stored
- Backend not responding

**Debugging**:
1. Run in headed mode: `npm run test:headed`
2. Check Network tab in Playwright Inspector
3. Verify API calls complete successfully
4. Check for redirects to `/error`

**Solution**: Ensure `waitForLoadState('networkidle')` after callback (already implemented)

### Issue 5: Tests Pass Locally, Fail in CI

**Common Causes**:
- Different `BASE_URL` configuration
- Missing environment variables
- Network timeouts
- Browser not installed

**Solutions**:
1. Verify GitHub secrets are set correctly
2. Check workflow creates `.env.playwright` properly
3. Ensure `npx playwright install chromium` runs in CI
4. Increase timeouts if needed in config

## Best Practices

### 1. Test Isolation

Each test should:
- Clean up authentication state in `beforeEach`
- Not depend on other tests' state
- Be runnable independently

### 2. Waiting Strategies

**Good**:
```typescript
await page.waitForURL(/\/dashboard/);
await page.waitForLoadState('networkidle');
await expect(page.getByText('Projects')).toBeVisible();
```

**Avoid**:
```typescript
await page.waitForTimeout(5000); // Fixed waits are brittle
```

### 3. Selectors

**Prefer (in order)**:
1. Role-based: `page.getByRole('button', { name: 'Login' })`
2. Test IDs: `page.getByTestId('submit-button')`
3. Text content: `page.getByText('Projects')`
4. CSS selectors: `page.locator('#menu-appbar')` (last resort)

### 4. Error Messages

Provide clear, actionable error messages:
```typescript
if (url.includes('/error')) {
  throw new Error('Login failed - redirected to error page. Check API connectivity.');
}
```

### 5. Debugging

Use Playwright's debugging tools:
- `npm run test:debug` - Step through tests
- `npx playwright show-trace trace.zip` - View trace files
- `page.pause()` - Add breakpoints in code

## Future Enhancements

### Planned Test Coverage Expansion

1. **Project Management**
   - Create new project submission
   - Upload documents
   - Submit for review

2. **Staff Workflows**
   - Review submissions
   - Approve/reject submissions
   - Request updates

3. **User Management**
   - Invite users
   - Manage team members
   - Update user roles

4. **Document Management**
   - Upload files
   - Version tracking
   - Download documents

### Testing Improvements

1. **API Mocking**: Use Playwright's route interception for faster, more reliable tests
2. **Visual Regression**: Screenshot comparison for UI consistency
3. **Accessibility Testing**: `@axe-core/playwright` integration
4. **Performance Testing**: Lighthouse CI integration
5. **Component Testing**: Consider Playwright component testing for isolated component tests

## Resources

- **Playwright Documentation**: https://playwright.dev
- **Best Practices**: https://playwright.dev/docs/best-practices
- **Trace Viewer**: https://trace.playwright.dev
- **VS Code Extension**: Recommended for test development and debugging

---

**Last Updated**: December 2024
**Framework**: Playwright
**Test Coverage**: Authentication flows (ROPC + BCSC UI)
**Status**: Production ready, expandable
