# EPIC.submit E2E Testing Context

## Overview

EPIC.submit uses **Playwright** for end-to-end (E2E) testing to validate authentication flows and critical user journeys. The testing strategy uses a **fully containerized environment** via Docker Compose to ensure consistent, isolated test execution both locally and in CI. Tests focus on establishing a "beachhead" of core functionality that can be expanded over time.

## Testing Framework

**Playwright v13.13.0+**
- Modern, fast, and reliable E2E testing framework
- Native cross-origin support (critical for OAuth flows)
- Built-in parallelization and retries
- Excellent debugging tools (trace viewer, inspector)
- Supports Chromium, Firefox, and WebKit

## Containerized Test Environment

### Benefits of Containerization

The containerized approach provides:

✅ **Consistency**: Identical environment locally and in CI
✅ **Isolation**: Each test run gets fresh database and services
✅ **Reproducibility**: Same Docker images = same behavior everywhere
✅ **No Manual Setup**: No need to run dev servers manually
✅ **Fast Cleanup**: `docker compose down -v` removes everything
✅ **Real Integrations**: Tests against actual Flask API + PostgreSQL, not mocks
✅ **Simplified Onboarding**: New developers just need Docker installed

### Architecture Overview

E2E tests run against a **fully containerized stack** defined in `docker-compose.e2e.yml`:

```
┌─────────────────────────────────────────────────┐
│ Host Machine (Test Runner)                     │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │ Playwright Test Suite                    │ │
│  │ - Runs on host (not containerized)       │ │
│  │ - Connects to http://localhost:5173      │ │
│  │ - Executes docker compose exec for seeds │ │
│  └────────────┬────────────┬────────────────┘ │
│               │            │                   │
│               │            │                   │
└───────────────┼────────────┼───────────────────┘
                │            │
        HTTP    │            │  docker exec
    ┌───────────▼────────┐   │
    │                    │   │
┌───┼────────────────────┼───┼───────────────────┐
│   │ Docker Compose     │   │                   │
│   │                    │   │                   │
│   │  ┌──────────────┐  │   │                   │
│   │  │ web          │◄─┘   │                   │
│   │  │ (Vite dev)   │      │                   │
│   │  │ :5173        │      │                   │
│   │  └──────┬───────┘      │                   │
│   │         │ HTTP         │                   │
│   │  ┌──────▼───────┐      │                   │
│   │  │ api          │◄─────┘ (seeding scripts) │
│   │  │ (Flask)      │                          │
│   │  │ :8080→:3200  │                          │
│   │  └──────┬───────┘                          │
│   │         │ SQL                               │
│   │  ┌──────▼───────┐                          │
│   │  │ db           │                          │
│   │  │ (PostgreSQL) │                          │
│   │  │ :5432        │                          │
│   │  └──────────────┘                          │
│   │                                             │
└───┼─────────────────────────────────────────────┘
    │
    │ (External services - DEV environment)
    └──► Keycloak: dev.loginproxy.gov.bc.ca
         Object Storage: epic-document-api (dev)
         Conditions Library: condition-api (dev)
```

### Container Services

**1. Database (db)**
- **Image**: `postgres:15`
- **Port**: `5432:5432`
- **Credentials**: `submit/submit/submit` (user/password/database)
- **Health Check**: `pg_isready` every 5 seconds
- **Purpose**: Isolated test database with fresh schema on each run

**2. API (api)**
- **Build**: `submit-api/Dockerfile`
- **Port**: `3200:8080` (host:container)
- **Startup**:
  1. Waits for database health check
  2. Runs migrations: `flask db upgrade`
  3. Starts Gunicorn: `--workers 3 --timeout 60`
- **Health Check**: `curl http://localhost:8080/ops/healthz` every 10 seconds
- **Authentication**: Uses DEV Keycloak (real OAuth flows)
- **CORS**: Configured for `http://localhost:5173`

**3. Web (web)**
- **Build**: `submit-web/Dockerfile.dev` (Vite dev mode, not production build)
- **Port**: `5173:5173`
- **Startup**:
  1. Waits for API health check
  2. Installs dependencies (if needed)
  3. Starts Vite dev server
- **Health Check**: `curl http://localhost:5173` every 10 seconds
- **Configuration**: Environment variables injected at runtime

### Data Seeding Strategy

Tests seed data by **executing Python scripts inside the API container**:

```typescript
// TypeScript helper (runs on host)
seedProponentUser('test-guid-123');

// Executes this command:
docker compose -f docker-compose.e2e.yml exec -T api \
  python scripts/seed_e2e_data.py --guid test-guid-123
```

**Benefits**:
- ✅ Uses Python/SQLAlchemy models (same as application)
- ✅ No TypeScript→SQL translation needed
- ✅ Matches API's language and ORM
- ✅ Can leverage existing service layer functions
- ✅ Automatic cleanup after tests

**Implementation**: See `submit-web/playwright/helpers/seed.ts`

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

E2E tests use Docker Compose to create an isolated, reproducible environment. All services run in containers except the Playwright test runner itself.

**Prerequisites**:
1. **Docker** and **Docker Compose** installed
2. **Node.js** 18+ installed (for running Playwright on host)
3. **Test credentials** configured in `.env.playwright`
4. **Playwright browsers** installed: `npx playwright install chromium`

**Step 1: Start Containerized Services**

From the project root:

```bash
# Start all services (db, api, web)
docker compose -f docker-compose.e2e.yml up -d

# Wait for services to be healthy (optional - tests will wait automatically)
docker compose -f docker-compose.e2e.yml ps
```

This starts:
- PostgreSQL database (runs migrations automatically)
- Flask API (http://localhost:3200)
- Vite dev server (http://localhost:5173)

**Step 2: Run Playwright Tests**

From `submit-web/` directory:

**Interactive UI Mode** (recommended for development):
```bash
npx playwright test --ui
```

**Headed Mode** (see browser):
```bash
npx playwright test --headed
```

**Headless Mode** (default):
```bash
npx playwright test
```

**Specific Test**:
```bash
npx playwright test proponent-bcsc-ui-login
```

**Debug Mode**:
```bash
npx playwright test --debug
```

**Step 3: View Results**

```bash
# View last test report
npx playwright show-report
```

**Step 4: Cleanup**

```bash
# Stop and remove containers
docker compose -f docker-compose.e2e.yml down

# Remove containers AND volumes (fresh database next run)
docker compose -f docker-compose.e2e.yml down -v
```

### Troubleshooting Local Setup

**Services not healthy:**
```bash
# Check service logs
docker compose -f docker-compose.e2e.yml logs db
docker compose -f docker-compose.e2e.yml logs api
docker compose -f docker-compose.e2e.yml logs web

# Check service health status
docker compose -f docker-compose.e2e.yml ps
```

**Port conflicts:**
If ports 3200, 5173, or 5432 are already in use, stop conflicting services or modify ports in `docker-compose.e2e.yml`.

**Database issues:**
```bash
# Reset database with fresh schema
docker compose -f docker-compose.e2e.yml down -v
docker compose -f docker-compose.e2e.yml up -d
```

### CI/CD Execution

**Workflow**: `.github/workflows/e2e.yml`

**Trigger**: Manual dispatch (`workflow_dispatch`)

**Environment**: Fully containerized stack (identical to local development)

**Pipeline Steps**:

**1. Checkout Code**
```yaml
- uses: actions/checkout@v4
```

**2. Start Containerized Services**
```bash
docker compose -f docker-compose.e2e.yml up -d
```

**3. Wait for Health Checks**
- Database: 120s timeout, checks every 2s
- API: 180s timeout, checks every 2s
- Web: 300s timeout, checks every 5s (longer for npm install + Vite startup)

**4. Debug Steps** (for troubleshooting)
- CORS configuration validation
- Database migration verification
- API container logs

**5. Setup Node.js and Playwright**
```bash
- uses: actions/setup-node@v4
  with:
    node-version: '18.x'
    cache: 'npm'
- npm install --legacy-peer-deps
- npx playwright install --with-deps chromium
```

**6. Run Playwright Tests**
```bash
npx playwright test
```

Environment variables passed to tests:
- `BASE_URL`: http://localhost:5173
- `STAFF_USERNAME`, `STAFF_PASSWORD`
- `PROPONENT_USERNAME`, `PROPONENT_PASSWORD`
- `PROPONENT_BCSC_USERNAME`, `PROPONENT_BCSC_PASSWORD`
- `PROPONENT_BCEID_USERNAME`, `PROPONENT_BCEID_PASSWORD`

**7. Upload Artifacts** (always, even on failure)
- Playwright HTML report (30-day retention)
- Test results (30-day retention)

**8. Show Service Logs** (on failure)
```bash
docker compose -f docker-compose.e2e.yml logs api
docker compose -f docker-compose.e2e.yml logs web
docker compose -f docker-compose.e2e.yml logs db
```

**9. Cleanup** (always)
```bash
docker compose -f docker-compose.e2e.yml down -v
```

**Required GitHub Secrets**:
- `KEYCLOAK_ADMIN_CLIENT_DEV` - Keycloak admin client ID
- `KEYCLOAK_ADMIN_SECRET_DEV` - Keycloak admin client secret
- `STAFF_USERNAME` - Staff test user
- `STAFF_PASSWORD` - Staff test password
- `PROPONENT_USERNAME` - Proponent test user
- `PROPONENT_PASSWORD` - Proponent test password
- `PROPONENT_BCSC_USERNAME` - BCSC test credentials
- `PROPONENT_BCSC_PASSWORD` - BCSC test password
- `PROPONENT_BCEID_USERNAME` - BCeID test credentials
- `PROPONENT_BCEID_PASSWORD` - BCeID test password

**Artifacts**:
- Playwright HTML report (interactive, browsable test results)
- Test results (screenshots, videos, traces for failed tests)

## Test Environment Requirements

### Containerized Services (Automatic)

All application services are **automatically provisioned** via Docker Compose:

**✅ Database**
- PostgreSQL 15
- Fresh schema on each run (via migrations)
- Isolated test data

**✅ Backend API**
- Flask application with Gunicorn
- Automatic database migrations on startup
- Health checked before tests run
- CORS pre-configured for `http://localhost:5173`

**✅ Frontend**
- Vite dev server (not production build)
- Environment variables injected at container startup
- Health checked before tests run

### External Services (DEV Environment)

The following **external services** are used from the DEV environment (not containerized):

**Keycloak (Identity Provider)**
- URL: `https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic`
- Client ID: `epic-submit`
- Purpose: Real OAuth/OIDC authentication flows
- Required for: BCSC login, BCeID login, ROPC token generation

**BC Services Card Test Environment**
- URL: `https://idtest.gov.bc.ca`
- Purpose: BCSC test login flow
- Credentials: Test accounts from GitHub secrets

**BCeID Test Environment**
- URL: `https://dev.loginproxy.gov.bc.ca`
- Purpose: Business BCeID login flow

**Object Storage API**
- URL: `https://epic-document-api-c8b80a-dev.apps.gold.devops.gov.bc.ca/api`
- Purpose: Document upload/download

**Conditions Library API**
- URL: `https://condition-api-c8b80a-dev.apps.gold.devops.gov.bc.ca/api`
- Purpose: Compliance condition data

### Why Hybrid Containerized + External Services?

**Containerized** (db, api, web):
- ✅ Full control over versions and configuration
- ✅ Isolated test environment
- ✅ Fast startup and teardown
- ✅ Consistent across local and CI

**External DEV services** (Keycloak, BCSC, etc.):
- ✅ Real OAuth flows (not mocked)
- ✅ Validates production-like authentication
- ✅ Tests actual identity provider integration
- ❌ Dependency on external availability

## Test Database Setup

### Automatic Migration

The API container **automatically runs migrations** on startup:

```bash
# From docker-compose.e2e.yml entrypoint:
flask db upgrade && \
gunicorn --bind 0.0.0.0:8080 wsgi:application
```

This ensures the test database always has the latest schema.

### Data Seeding

Tests seed their own data using the **docker exec pattern**:

```typescript
// In test beforeEach hook:
test.beforeEach(() => {
  seedProponentUser('test-guid-123', {
    firstName: 'Test',
    lastName: 'User',
    proponentId: 8888
  });
});

// In test afterEach hook:
test.afterEach(() => {
  cleanupTestData({ guid: 'test-guid-123' });
});
```

This executes:
```bash
docker compose -f docker-compose.e2e.yml exec -T api \
  python scripts/seed_e2e_data.py \
  --guid test-guid-123 \
  --first-name Test \
  --last-name User \
  --proponent-id 8888
```

**Benefits**:
- Each test gets fresh data
- No shared state between tests
- Automatic cleanup
- Python/SQLAlchemy for data creation (matches API)

## Common Issues and Solutions

### Issue 1: Services Not Starting

**Symptoms**:
- `docker compose up` fails
- Containers exit immediately
- Health checks never pass

**Debugging**:
```bash
# Check service status
docker compose -f docker-compose.e2e.yml ps

# View logs for failing service
docker compose -f docker-compose.e2e.yml logs db
docker compose -f docker-compose.e2e.yml logs api
docker compose -f docker-compose.e2e.yml logs web

# Check for port conflicts
netstat -an | grep 5432  # Database
netstat -an | grep 3200  # API
netstat -an | grep 5173  # Web
```

**Common Solutions**:
1. **Port already in use**: Stop conflicting services or change ports in `docker-compose.e2e.yml`
2. **Build failures**: Rebuild images with `docker compose -f docker-compose.e2e.yml build --no-cache`
3. **Database not ready**: Increase health check retries in compose file

### Issue 2: API Container Fails Health Checks

**Symptoms**:
- API container starts but never becomes healthy
- Migrations fail
- `/ops/healthz` endpoint returns 500

**Debugging**:
```bash
# Check API logs
docker compose -f docker-compose.e2e.yml logs api

# Check if migrations ran
docker compose -f docker-compose.e2e.yml logs api | grep migration

# Test health endpoint manually
curl http://localhost:3200/ops/healthz
```

**Common Causes**:
1. **Migration failures**: Schema conflicts, missing dependencies
2. **Database connection issues**: Wrong credentials, db not ready
3. **Missing secrets**: `KEYCLOAK_ADMIN_CLIENT` or `KEYCLOAK_ADMIN_SECRET` not set

**Solutions**:
```bash
# Reset database completely
docker compose -f docker-compose.e2e.yml down -v
docker compose -f docker-compose.e2e.yml up -d

# Check database connectivity from API container
docker compose -f docker-compose.e2e.yml exec api \
  psql -h db -U submit -d submit -c "SELECT 1;"
```

### Issue 3: Web Container Build Issues

**Symptoms**:
- Web container fails to build
- `npm install` errors
- Vite server won't start

**Debugging**:
```bash
# View web container logs
docker compose -f docker-compose.e2e.yml logs web

# Rebuild web container
docker compose -f docker-compose.e2e.yml build --no-cache web
```

**Common Solutions**:
1. **Node version mismatch**: Check Dockerfile.dev uses Node 18+
2. **npm install failures**: Delete `node_modules` and rebuild
3. **Port 5173 in use**: Stop other Vite servers or change port

### Issue 4: Tests Can't Connect to Services

**Symptoms**:
- Tests timeout waiting for `http://localhost:5173`
- Connection refused errors
- Playwright can't reach services

**Debugging**:
```bash
# Verify services are accessible from host
curl http://localhost:5173      # Web
curl http://localhost:3200/api  # API
curl http://localhost:5432      # Database (should refuse connection - expected)

# Check if services are healthy
docker compose -f docker-compose.e2e.yml ps
```

**Solutions**:
1. Ensure services are fully started before running tests
2. Check firewall/antivirus isn't blocking localhost connections
3. Use `127.0.0.1` instead of `localhost` if DNS issues

### Issue 5: Data Seeding Failures

**Symptoms**:
- `seedProponentUser()` throws errors
- "container not found" messages
- Tests fail with missing data

**Debugging**:
```bash
# Check if API container is running
docker compose -f docker-compose.e2e.yml ps api

# Run seeding script manually
docker compose -f docker-compose.e2e.yml exec -T api \
  python scripts/seed_e2e_data.py --guid test-123
```

**Common Causes**:
1. **API container not running**: Start services first
2. **Wrong compose file path**: Seeding helpers look for `docker-compose.e2e.yml` in project root
3. **Python script errors**: Check script exists and has no syntax errors

**Solutions**:
```bash
# Verify script location
ls submit-api/scripts/seed_e2e_data.py

# Test script directly in container
docker compose -f docker-compose.e2e.yml exec api \
  python scripts/seed_e2e_data.py --help
```

### Issue 6: SecurityError on sessionStorage

**Symptoms**: `SecurityError: Failed to read the 'sessionStorage' property`

**Cause**: Trying to access `sessionStorage` before page has navigated to valid origin

**Solution**: Already fixed in `kcLogout()` function with try-catch wrapper

### Issue 7: Strict Mode Violation - Multiple Elements

**Symptoms**: `Error: strict mode violation: getByRole() resolved to 4 elements`

**Cause**: Multiple "Login" buttons on page (desktop + mobile, header + footer, etc.)

**Solution**: Use `.first()` to select the first matching element:
```typescript
await page.getByRole('button', { name: 'Login' }).first().click();
```

### Issue 8: Tests Pass Locally, Fail in CI

**Common Causes**:
- GitHub secrets not configured
- Services fail health checks in CI (timing)
- Browser not installed in CI
- Docker daemon issues in GitHub Actions

**Solutions**:
1. **Verify secrets**: Check all required secrets are set in repository settings
2. **Increase timeouts**: Health check timeouts might need adjustment for CI
3. **Check workflow logs**: Look for service startup failures
4. **Verify Playwright install**: Ensure `npx playwright install --with-deps chromium` runs

### Issue 9: CORS Errors in Browser Console

**Symptoms**:
- API requests blocked by CORS
- "Access-Control-Allow-Origin" errors in browser
- Tests fail after authentication

**Debugging**:
```bash
# Check CORS configuration in API container
docker compose -f docker-compose.e2e.yml exec api printenv | grep CORS

# Test CORS headers manually
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:3200/api/users/me -v
```

**Solution**: Verify `CORS_ORIGIN` in `docker-compose.e2e.yml` includes `http://localhost:5173`

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
**Test Environment**: Fully containerized (Docker Compose)
**Test Coverage**: Authentication flows (ROPC + BCSC UI)
**Data Seeding**: Docker exec pattern with Python scripts
**Status**: Production ready, expandable
