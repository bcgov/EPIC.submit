# EPIC.submit E2E Testing Context

## Overview

This document provides comprehensive context about the E2E testing implementation for EPIC.submit, including architecture decisions, authentication flows, configuration, and known issues.

## Testing Philosophy

**Goal**: Establish a "beachhead" E2E testing approach that validates core authentication flows against the real dev environment.

**Approach**: Dual authentication strategy
- **ROPC Flow**: Fast, reliable token-based authentication for test setup/teardown
- **UI Flow**: Full browser-based authentication testing for validating actual user experience

## Architecture

### Environment

- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend API**: `http://localhost:3200`
- **Dev Environment**: `https://submit-web-c8b80a-dev.apps.gold.devops.gov.bc.ca`
- **Keycloak**: `https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic`
- **Client ID**: `epic-submit`

### Test Framework

- **Cypress**: v13.13.0
- **Language**: TypeScript
- **Test Types**: E2E (not component tests)

## Authentication Flows

### 1. ROPC (Resource Owner Password Credentials) Flow

**Purpose**: Fast authentication for test setup, ideal for beachhead testing

**Files**:
- `cypress/e2e/staff-login.cy.ts`
- `cypress/e2e/proponent-login.cy.ts`

**Command**: `cy.kcLogin(username, password)`

**How it works**:
1. POST to Keycloak token endpoint with username/password
2. Receive `access_token`, `id_token`, `refresh_token`
3. Store tokens in `sessionStorage` matching `oidc-client-ts` format
4. Visit app (authenticated session active)

**Pros**:
- ✅ Fast and reliable (no UI interaction)
- ✅ Ideal for test setup/teardown
- ✅ No cross-origin complexity

**Cons**:
- ❌ Doesn't test actual UI login flow
- ❌ Bypasses identity provider pages

**Requirements**:
- Direct Access Grants enabled on Keycloak client (already enabled)

### 2. Full UI Login Flow

**Purpose**: Test actual user authentication experience through identity providers

**Files**:
- `cypress/e2e/proponent-bcsc-ui-login.cy.ts`
- `cypress/e2e/proponent-bceid-ui-login.cy.ts`

**Commands**:
- `cy.loginViaBCSC(username, password)`
- `cy.loginViaBCeID(username, password)`

#### BCSC (BC Services Card) Flow

**Multi-step process**:

1. Click "Login" button → Select "BC Services Card"
2. Redirected to `https://idtest.gov.bc.ca/login/entry#start`
3. Click "Test with username and password"
4. **Intermediate page** at `/login/username`:
   - Check the consent/terms checkbox
   - Click "Continue" button
5. Auth form at `/login/auth`:
   - Fill username
   - Fill password
   - Submit form
6. OAuth callback → app routing to `/oidc-callback`
7. Final routing to `/proponent` or `/staff`

**Implementation**:
```typescript
cy.origin('https://idtest.gov.bc.ca', { args: { username, password } }, ({ username, password }) => {
  // Step 3a: Click "Test with username and password"
  cy.get('#tile_test_with_username_password_device_div_id').click();

  // Step 3b: Checkbox page
  cy.url().should('include', '/login/username');
  cy.get('input[type="checkbox"]').check();
  cy.contains('button', 'Continue').click();

  // Step 3c: Credentials
  cy.url().should('include', '/login/auth');
  cy.get('#username').type(username);
  cy.get('#password').type(password, { log: false });
  cy.get('#submit-btn').click();
});
```

#### BCeID (Business BCeID) Flow

**Simpler process**:

1. Click "Login" button → Select "BCeID"
2. Redirected to BCeID login page at `dev.loginproxy.gov.bc.ca`
3. Fill credentials:
   - Username: `[name="user"]`
   - Password: `[name="password"]`
   - Submit: `[name="btnSubmit"]`
4. OAuth callback → app routing

**Implementation**:
```typescript
cy.origin('https://dev.loginproxy.gov.bc.ca', { args: { username, password } }, ({ username, password }) => {
  cy.get('[name="user"]').type(username);
  cy.get('[name="password"]').type(password, { log: false });
  cy.get('[name="btnSubmit"]').click();
});
```

**Pros**:
- ✅ Tests actual user login experience
- ✅ Validates identity provider integration
- ✅ Catches UI/UX issues

**Cons**:
- ❌ Slower than ROPC
- ❌ More brittle (external page changes)
- ❌ Network dependent
- ❌ Cross-origin complexity

## Configuration

### Cypress Config (`cypress.config.cjs`)

```javascript
e2e: {
  baseUrl: 'http://localhost:5173',
  specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  supportFile: 'cypress/support/e2e.ts',
  video: true,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  pageLoadTimeout: 60000,  // Increased for OAuth redirects
  // Cross-origin support for BCSC/BCeID
  experimentalModifyObstructiveThirdPartyCode: true,
  chromeWebSecurity: false,  // Required for cross-origin OAuth flow
  retries: {
    runMode: 2,
    openMode: 0
  }
}
```

### TypeScript Configuration

**Structure**:
- `submit-web/tsconfig.json` - References cypress config
- `cypress/tsconfig.json` - Cypress-specific TypeScript config
- `cypress/support/e2e.d.ts` - Custom command type definitions

**Key Pattern**:
```typescript
// cypress/support/e2e.ts
/// <reference types="cypress" />
/// <reference path="./e2e.d.ts" />
```

This ensures TypeScript recognizes Cypress globals and custom commands.

### Environment Variables

**File**: `cypress.env.json` (gitignored)

**Template**: `cypress.env.json.template`

```json
{
  "STAFF_USERNAME": "your-staff-username",
  "STAFF_PASSWORD": "your-staff-password",
  "PROPONENT_USERNAME": "your-proponent-username",
  "PROPONENT_PASSWORD": "your-proponent-password",
  "PROPONENT_BCSC_USERNAME": "your-bcsc-test-username",
  "PROPONENT_BCSC_PASSWORD": "your-bcsc-test-password",
  "PROPONENT_BCEID_USERNAME": "your-bceid-test-username",
  "PROPONENT_BCEID_PASSWORD": "your-bceid-test-password"
}
```

**Usage**:
- First 4 credentials: ROPC flow tests
- Last 4 credentials: UI flow tests

## Known Issues & Solutions

### Issue 1: TypeScript Errors in E2E Test Files

**Problem**: `Cannot find name 'describe'` errors in e2e test files

**Root Cause**: Missing TypeScript configuration for Cypress folder

**Solution**:
1. Create `cypress/tsconfig.json` with Cypress types
2. Add as project reference in main `tsconfig.json`
3. Add triple-slash references in `cypress/support/e2e.ts`:
   ```typescript
   /// <reference types="cypress" />
   /// <reference path="./e2e.d.ts" />
   ```
4. Reload VS Code TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Issue 2: Backend API Returns ERR_EMPTY_RESPONSE

**Problem**: After BCSC login, API call to `/api/users/guid/<guid>` fails with `ERR_EMPTY_RESPONSE`

**Root Cause**: Bug in `submit-api/src/submit_api/resources/proponent/user.py` line 85:
```python
# WRONG
if not user:
    return ResourceNotFoundError(f"User with guid {guid} not found")

# CORRECT
if not user:
    raise ResourceNotFoundError(f"User with guid {guid} not found")
```

**Why**: Returning an exception instead of raising it causes Flask to fail serialization and close the connection without a response.

**Solution**: Changed `return` to `raise` on line 85

**Current State**: Fixed ✅

### Issue 3: BCSC Login Has Extra Checkbox Step

**Problem**: Initial BCSC flow didn't account for intermediate consent page

**Discovery**: After clicking "Test with username and password", there's an intermediate page at `/login/username` with a checkbox that must be checked before continuing to the actual login form.

**Solution**: Updated `loginViaBCSC` command to handle the 3-step flow:
1. Click "Test with username and password"
2. Check checkbox on `/login/username` page and click "Continue"
3. Fill credentials on `/login/auth` page

**Current State**: Implemented ✅

### Issue 4: Frontend Calls Wrong Endpoint

**Context**: Frontend has two functions in `useAccounts.ts`:
- `getUserByGuid(guid)` → Calls `/users/guid/${guid}` (vulnerable to 404 bug)
- `getOrCreateCurrentUser()` → Calls `/users/me` POST (correct, auto-provisions)

**Current State**: The `getAccount()` function correctly uses `getOrCreateCurrentUser()`, but older code or race conditions might still trigger the buggy endpoint.

**Recommendation**: Ensure all user fetching goes through `/users/me` endpoint.

## File Structure

```
submit-web/
├── cypress/
│   ├── e2e/
│   │   ├── staff-login.cy.ts              # ROPC: Staff login
│   │   ├── proponent-login.cy.ts          # ROPC: Proponent login
│   │   ├── proponent-bcsc-ui-login.cy.ts  # UI: BCSC login
│   │   ├── proponent-bceid-ui-login.cy.ts # UI: BCeID login
│   │   └── README.md                      # Test documentation
│   ├── support/
│   │   ├── e2e.ts                         # Custom commands implementation
│   │   ├── e2e.d.ts                       # TypeScript definitions
│   │   └── commands.ts                    # Existing commands
│   ├── tsconfig.json                      # Cypress TypeScript config
│   ├── cypress.env.json.template          # Template for credentials
│   └── cypress.env.json                   # Actual credentials (gitignored)
├── cypress.config.cjs                     # Cypress configuration
└── tsconfig.json                          # Main TypeScript config (references cypress)
```

## Custom Commands

### kcLogin(username, password)

**Type**: ROPC authentication
**Returns**: void
**Side Effects**: Stores tokens in sessionStorage

```typescript
cy.kcLogin('username', 'password');
cy.visit('/'); // Now authenticated
```

### kcLogout()

**Type**: Cleanup
**Returns**: void
**Side Effects**: Clears sessionStorage

```typescript
cy.kcLogout(); // Clean state for next test
```

### loginViaBCSC(username, password)

**Type**: UI authentication via BCSC
**Returns**: void
**Side Effects**: Navigates through full BCSC login flow, ends on app dashboard

```typescript
cy.loginViaBCSC('T00001122', 'password');
// Now on /proponent or /staff dashboard
```

### loginViaBCeID(username, password)

**Type**: UI authentication via BCeID
**Returns**: void
**Side Effects**: Navigates through BCeID login flow, ends on app dashboard

```typescript
cy.loginViaBCeID('username', 'password');
// Now on /proponent or /staff dashboard
```

## Running Tests

### Locally

**Interactive mode** (recommended for development):
```bash
cd submit-web
npx cypress open --e2e
```

**Headless mode**:
```bash
npx cypress run --e2e --browser chrome
```

**Specific test**:
```bash
npx cypress run --spec "cypress/e2e/proponent-bcsc-ui-login.cy.ts"
```

### CI/CD

**Workflow**: `.github/workflows/e2e-beachhead.yml`
**Trigger**: Manual dispatch
**Secrets Required**:
- `CYPRESS_STAFF_USERNAME`
- `CYPRESS_STAFF_PASSWORD`
- `CYPRESS_PROPONENT_USERNAME`
- `CYPRESS_PROPONENT_PASSWORD`
- `CYPRESS_PROPONENT_BCSC_USERNAME`
- `CYPRESS_PROPONENT_BCSC_PASSWORD`
- `CYPRESS_PROPONENT_BCEID_USERNAME`
- `CYPRESS_PROPONENT_BCEID_PASSWORD`

## Database Setup

**Script**: `submit-api/scripts/create_e2e_test_users.sql`

**Important**: Replace placeholder GUIDs with actual Keycloak user GUIDs

**Structure**:
- Creates 2 test users (Staff and Proponent) in `users` table
- Links to actual Keycloak accounts via `auth_guid`

## Exception Handling

**Global exception handler** in `cypress/support/e2e.ts`:

```typescript
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('ResizeObserver') ||
    err.message.includes('keycloak') ||
    err.message.includes('Unexpected')
  ) {
    return false; // Prevent test failure
  }
  return true; // Allow other exceptions to fail tests
});
```

**Why**: OIDC libraries and React components sometimes throw expected errors during auth flow that shouldn't fail tests.

## Cross-Origin Testing

**Challenge**: BCSC and BCeID login pages are on different domains

**Solution**: `cy.origin()` command

**Requirements**:
```javascript
// In cypress.config.cjs
chromeWebSecurity: false,
experimentalModifyObstructiveThirdPartyCode: true,
pageLoadTimeout: 60000
```

**Pattern**:
```typescript
cy.origin('https://external-domain.com',
  { args: { username, password } },
  ({ username, password }) => {
    // Code here runs in the context of external-domain.com
    cy.get('#field').type(username);
  }
);
// Back to original domain context
```

**Limitations**:
- Can only pass serializable data via `args`
- No access to parent scope variables
- Can't use custom commands defined outside the origin block

## Authentication Token Flow

### ROPC Flow (Manual)

1. POST to `/protocol/openid-connect/token`
2. Receive tokens
3. Store in sessionStorage with key: `oidc.user:https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic:epic-submit`
4. Format matches `oidc-client-ts` WebStorageStateStore

### UI Flow (OAuth Authorization Code + PKCE)

1. Click Login → Identity Provider
2. Redirect to IdP with auth request
3. User authenticates on IdP
4. Redirect back to `/oidc-callback` with authorization code
5. `react-oidc-context` exchanges code for tokens
6. Tokens stored in sessionStorage automatically
7. App routes to appropriate dashboard

## Debugging Tips

### 1. Check Browser Console in Cypress

```bash
npx cypress open --e2e
```
Then check the browser console in the Cypress Test Runner for:
- Network errors
- CORS issues
- API call failures

### 2. Check Network Tab

- Filter by `XHR` to see API calls
- Look for failed requests (red)
- Check request/response payloads

### 3. Backend Not Responding

**Check if backend is running**:
```bash
# Windows
netstat -ano | findstr :3200

# macOS/Linux
lsof -i :3200
```

**Start backend**:
```bash
cd submit-api
npm run dev  # or your dev script
```

### 4. CORS Issues

**Symptom**: `Access to fetch at '...' has been blocked by CORS policy`

**Solution**: Ensure backend CORS allows `http://localhost:5173`

### 5. OAuth Callback Failures

**Common causes**:
- Backend not running
- User GUID doesn't exist in database
- Backend endpoint has bugs (e.g., line 85 bug)
- Token format mismatch

**Check**: Backend logs for incoming requests

## Next Steps (Future Enhancements)

1. **Expand test coverage**:
   - Project creation workflows
   - File uploads
   - Staff review processes
   - Role-based access control

2. **Add API helpers**:
   - Database seeding
   - Test data cleanup
   - Direct API calls for setup

3. **Visual regression testing**:
   - Screenshot comparison
   - Percy/Applitools integration

4. **Performance testing**:
   - Page load times
   - API response times
   - Bundle size monitoring

5. **Accessibility testing**:
   - cypress-axe integration
   - WCAG compliance

## Important Notes

### Do NOT Commit

- `cypress.env.json` - Contains real credentials
- `cypress/videos/` - Test run recordings
- `cypress/screenshots/` - Failure screenshots

### Backend Dependency

E2E tests require backend API running on `localhost:3200`. Without it:
- ROPC tests: Will fail at token exchange
- UI tests: Will fail at `/oidc-callback` when app tries to load user data

### Test User Management

- Test users must exist in both Keycloak AND database
- GUIDs must match between systems
- Staff users auto-provision on first login (if they have valid roles)
- Proponent users must be manually created in database

### Identity Provider Stability

BCSC and BCeID test environments are external dependencies:
- `https://idtest.gov.bc.ca` - BCSC test environment
- `https://dev.loginproxy.gov.bc.ca` - BCeID dev environment

If these change their UI/flows, tests will break. Monitor for changes and update selectors accordingly.

## Contact & Resources

- **Cypress Docs**: https://docs.cypress.io
- **react-oidc-context**: https://github.com/authts/react-oidc-context
- **Keycloak OIDC**: https://www.keycloak.org/docs/latest/securing_apps/

---

**Last Updated**: December 2024
**Status**: Beachhead implementation complete ✅
**Test Coverage**: Authentication flows (ROPC + UI)
