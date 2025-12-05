# E2E Beachhead Tests

## Overview

Basic end-to-end tests that run against the **dev environment** (`https://submit-web-c8b80a-dev.apps.gold.devops.gov.bc.ca`) using real Keycloak authentication.

This is a "beachhead" implementation focused on proving authentication works for both Staff and Proponent users.

## Local Setup

### 1. Create Environment File

Copy the template and fill in real test credentials:

```bash
cd submit-web
cp cypress.env.json.template cypress.env.json
```

Edit `cypress.env.json`:

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

**Note**: The first 4 credentials are for ROPC flow tests, the last 4 are for UI flow tests.

**⚠️ Important**: `cypress.env.json` is gitignored - never commit this file!

### 2. Ensure Test Users Exist

Test users must exist in:

1. **Keycloak** (`eao-epic` realm)
   - Login to Keycloak Admin Console
   - Create or identify test users
   - Copy the user's `ID` field (this becomes `auth_guid`)

2. **Database** (dev environment)
   - Run the SQL script: `submit-api/scripts/create_e2e_test_users.sql`
   - Replace placeholder GUIDs with actual Keycloak user IDs
   - Execute against dev database

### 3. Verify Direct Access Grants Enabled

The `epic-submit` Keycloak client must have **Direct Access Grants Enabled**:
- Keycloak Admin → Clients → `epic-submit`
- Settings → Direct Access Grants Enabled: **ON**

✅ This is already enabled per project configuration.

## Running Tests

### Interactive Mode (Recommended for Development)

```bash
cd submit-web
npx cypress open --e2e
```

Then click on a test to run it in the Cypress Test Runner.

### Headless Mode

```bash
cd submit-web
npx cypress run --e2e
```

Runs all E2E tests in headless Chrome.

### Run Specific Test

```bash
npx cypress run --e2e --spec "cypress/e2e/staff-login.cy.ts"
```

## CI/CD

Tests can be triggered manually via GitHub Actions:

1. Go to **Actions** → **E2E Beachhead Tests**
2. Click **Run workflow**
3. Results and artifacts (screenshots/videos) will be available after completion

### Required GitHub Secrets

Add these secrets via **Settings → Secrets and variables → Actions**:

| Secret Name | Description |
|-------------|-------------|
| `CYPRESS_STAFF_USERNAME` | Staff test user username (ROPC flow) |
| `CYPRESS_STAFF_PASSWORD` | Staff test user password (ROPC flow) |
| `CYPRESS_PROPONENT_USERNAME` | Proponent test user username (ROPC flow) |
| `CYPRESS_PROPONENT_PASSWORD` | Proponent test user password (ROPC flow) |
| `CYPRESS_PROPONENT_BCSC_USERNAME` | BCSC test username (UI flow) |
| `CYPRESS_PROPONENT_BCSC_PASSWORD` | BCSC test password (UI flow) |
| `CYPRESS_PROPONENT_BCEID_USERNAME` | BCeID test username (UI flow) |
| `CYPRESS_PROPONENT_BCEID_PASSWORD` | BCeID test password (UI flow) |

## Current Tests

### ROPC Flow Tests

**staff-login.cy.ts**
- Uses `cy.kcLogin()` for fast token-based auth
- Verifies staff user can access dashboard
- Checks for "Projects" page

**proponent-login.cy.ts**
- Uses `cy.kcLogin()` for fast token-based auth
- Verifies proponent user can access dashboard
- Checks for "Projects" page

### UI Flow Tests

**proponent-bcsc-ui-login.cy.ts**
- Uses `cy.loginViaBCSC()` for full BCSC UI flow
- Tests actual BCSC login experience
- Verifies multi-step authentication
- Checks OAuth callback and routing

**proponent-bceid-ui-login.cy.ts**
- Uses `cy.loginViaBCeID()` for full BCeID UI flow
- Tests actual BCeID login experience
- Verifies cross-origin authentication
- Checks OAuth callback and routing

## Authentication Flows

Tests support **two authentication approaches**:

### 1. ROPC (Resource Owner Password Credentials) Flow

**Files**: `staff-login.cy.ts`, `proponent-login.cy.ts`
**Command**: `cy.kcLogin(username, password)`

1. POST to Keycloak token endpoint with username/password
2. Receive `access_token`, `id_token`, `refresh_token`
3. Store tokens in `sessionStorage` matching `oidc-client-ts` format
4. Visit app (authenticated session active)

**Pros**:
- ✅ Fast and reliable (no UI interaction)
- ✅ Ideal for test setup/teardown
- ✅ Works with existing `react-oidc-context` authentication
- ✅ Requires Direct Access Grants enabled (already done)

**Cons**:
- ❌ Doesn't test actual UI login flow
- ❌ Bypasses identity provider pages

### 2. Full UI Login Flow

**Files**: `proponent-bcsc-ui-login.cy.ts`, `proponent-bceid-ui-login.cy.ts`
**Commands**: `cy.loginViaBCSC(username, password)`, `cy.loginViaBCeID(username, password)`

**BCSC (BC Services Card) Flow**:
1. Click "Login" button → Select "BC Services Card"
2. Redirected to `https://idtest.gov.bc.ca/login/entry#start`
3. Click "Test with username and password"
4. Fill credentials on `/login/auth` page
5. OAuth callback → app routing

**BCeID (Business BCeID) Flow**:
1. Click "Login" button → Select "BCeID"
2. Redirected to BCeID login page
3. Fill credentials
4. OAuth callback → app routing

**Pros**:
- ✅ Tests actual user login experience
- ✅ Validates identity provider integration
- ✅ Catches UI/UX issues

**Cons**:
- ❌ Slower than ROPC
- ❌ More brittle (external page changes)
- ❌ Network dependent

## Troubleshooting

### "Invalid credentials" Error

**Cause**: Username or password incorrect in `cypress.env.json`

**Fix**:
- Verify credentials match Keycloak users
- Check for typos or extra spaces
- Ensure test users are active in Keycloak

### "User not found in database"

**Cause**: Database user record doesn't exist or `auth_guid` mismatch

**Fix**:
1. Verify `auth_guid` in database matches Keycloak user ID exactly
2. Check user `type` is correct (STAFF vs PROPONENT)
3. Ensure related records exist (staff_users or account_users)
4. Run verification queries in SQL script

### "Direct Access Grants not enabled"

**Cause**: Keycloak client configuration issue

**Fix**: Already enabled - if error persists, verify client settings in Keycloak

### Test Passes but Nothing Happens

**Cause**: Tests may be passing false positives

**Fix**:
- Open Cypress Test Runner (`npx cypress open --e2e`)
- Watch the test execution visually
- Verify assertions are checking correct elements
- Update selectors if app structure changed

### CORS Errors (ROPC Flow)

**Cause**: Keycloak and app on different domains

**Fix**: Current implementation handles this - if issues persist:
- Check network tab in Cypress Test Runner
- Verify Keycloak URL is accessible
- Check CORS settings in Keycloak client

### Cross-Origin Errors (UI Flow)

**Cause**: BCSC/BCeID pages on different domains

**Fix**:
- Verify `chromeWebSecurity: false` in `cypress.config.cjs`
- Ensure `experimentalModifyObstructiveThirdPartyCode: true`
- Check `pageLoadTimeout: 60000` for OAuth redirects

### Login Button Not Found (UI Flow)

**Cause**: Already logged in or button selector changed

**Fix**:
- Verify `cy.kcLogout()` in `beforeEach` is working
- Check button selector matches actual UI
- Inspect element in Cypress Test Runner

### OAuth Callback Timeout (UI Flow)

**Cause**: Slow network or auth failure

**Fix**:
- Check credentials are correct for the IdP
- Verify redirect URI matches app config
- Increase timeout in test assertions
- Check network tab for auth errors

### BCSC "Test with username and password" Not Clickable (UI Flow)

**Cause**: Selector changed or page not loaded

**Fix**:
- Check selector: `#tile_test_with_username_password_device_div_id`
- Add wait before clicking if needed
- Verify you're on the correct BCSC environment (idtest.gov.bc.ca)

## File Structure

```
submit-web/cypress/
├── e2e/
│   ├── staff-login.cy.ts              # Staff user login test (ROPC)
│   ├── proponent-login.cy.ts          # Proponent user login test (ROPC)
│   ├── proponent-bcsc-ui-login.cy.ts  # BCSC UI flow test
│   ├── proponent-bceid-ui-login.cy.ts # BCeID UI flow test
│   └── README.md                      # This file
├── support/
│   ├── e2e.ts                         # Custom commands (kcLogin, loginViaBCSC, loginViaBCeID, kcLogout)
│   ├── e2e.d.ts                       # TypeScript definitions
│   └── commands.ts                    # Existing commands
├── cypress.env.json.template          # Template for credentials
└── cypress.env.json                   # Actual credentials (gitignored)
```

## Next Steps

After beachhead is stable:

1. **Expand test coverage**:
   - Create submission test
   - Upload document test
   - Review submission (staff) test
   - Request updates test

2. **Add test data cleanup**:
   - Delete test submissions after tests
   - Implement data isolation strategy

3. **Move to ephemeral environments**:
   - See `docs/e2e-plan.md` for full strategy
   - Deploy temporary namespace per test run
   - Database seeding
   - Complete isolation

4. **Add scheduled runs**:
   - Daily smoke tests
   - Detect environment drift

## Configuration Reference

### Keycloak

- **Authority**: `https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic`
- **Client ID**: `epic-submit`
- **Realm**: `eao-epic`
- **Token Endpoint**: `/protocol/openid-connect/token`

### Dev Environment

- **Web URL**: `https://submit-web-c8b80a-dev.apps.gold.devops.gov.bc.ca`
- **API URL**: `https://submit-api-c8b80a-dev.apps.gold.devops.gov.bc.ca/api`
- **Namespace**: `c8b80a-dev`
- **Cluster**: `apps.gold.devops.gov.bc.ca`

## Support

For questions or issues:
- Check this README first
- Review the implementation plan
- Ask the team in #epic-submit channel
