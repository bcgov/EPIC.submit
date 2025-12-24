# Playwright E2E Testing Guide

## Overview

This guide helps you run and understand the E2E tests for EPIC.submit. The tests use Playwright with modern patterns like Page Object Model and fixtures for clean, maintainable test code.

## Quick Start

### First Time Setup

1. **Install Playwright browsers** (one-time):

   ```bash
   cd submit-web
   npx playwright install chromium
   ```

2. **Copy environment template**:

   ```bash
   cp .env.playwright.template .env.playwright
   ```

3. **Fill in test credentials** in `.env.playwright`:
   ```bash
   BASE_URL=http://localhost:5173
   STAFF_USERNAME=your-username
   STAFF_PASSWORD=your-password
   PROPONENT_USERNAME=your-username
   PROPONENT_PASSWORD=your-password
   PROPONENT_BCSC_USERNAME=your-username
   PROPONENT_BCSC_PASSWORD=your-password
   # ... fill in other credentials
   ```

### Running Tests

**Start services** (from project root):

```bash
docker compose -f docker-compose.e2e.yml up -d
```

This starts PostgreSQL, API, and Web automatically. Wait ~2 minutes for health checks to complete.

**Run tests** (from submit-web/):

```bash
npm run test:ui      # Interactive mode (recommended)
npm run test:headed  # Watch browser
npm test             # Headless (CI-style)
npm run test:debug   # Debug mode
```

**Stop services**:

```bash
docker compose -f docker-compose.e2e.yml down
```

## Architecture

Tests run on your machine. Services (database, API, web) run in Docker containers.

```
Your Machine
├─ Playwright tests (you run these)
└─ Docker Compose (starts these)
   ├─ PostgreSQL
   ├─ Submit API (port 3200)
   └─ Submit Web (port 5173)
```

### File Structure

```
submit-web/playwright/
├── e2e/
│   ├── auth/              # Login tests
│   ├── onboarding/        # Registration tests
│   └── submissions/       # Submission tests
├── fixtures/              # Test setup helpers (auto-seeding)
├── pages/                 # Page Object Model
├── helpers/               # Utilities (seeding, environment)
└── types/                 # TypeScript types
```

### Key Files

- `playwright.config.ts` - Test configuration
- `.env.playwright` - Test credentials (gitignored)
- `docker-compose.e2e.yml` - Services configuration (in project root)

## Writing Tests

### Basic Pattern

```typescript
import { test, expect } from "@playwright/test";

test("my test", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome")).toBeVisible();
});
```

### Using Fixtures (Advanced)

Fixtures automatically set up test data and authentication:

```typescript
import { test } from "../../fixtures/db.fixtures";

test("create submission", async ({ authenticatedProponentWithProject }) => {
  // Already logged in with seeded data!
  const { page } = authenticatedProponentWithProject;
  await page.getByRole("button", { name: "New Submission" }).click();
});
```

**Example**: See [create-submission.spec.ts](e2e/submissions/create-submission.spec.ts) for complete fixture usage.

### Using Page Objects (Advanced)

Page Objects make tests cleaner and more maintainable:

```typescript
import { ProjectDashboardPage } from "../../pages/submissions";

test("navigate dashboard", async ({ page }) => {
  const dashboard = new ProjectDashboardPage(page);
  await dashboard.navigateToProject(123);
  await dashboard.clickNewSubmission();
});
```

**Example**: See [pages/submissions/](pages/submissions/) for page object implementations.

## Authentication

### ROPC Flow (Fast Login)

Use `kcLogin()` for quick authentication without UI interaction:

```typescript
import { kcLogin } from "../auth";

test("my test", async ({ page }) => {
  await kcLogin(page, process.env.STAFF_USERNAME!, process.env.STAFF_PASSWORD!);
  await page.goto("/");
  // Now authenticated
});
```

**Pros**: Fast, reliable, ideal for test setup
**Cons**: Doesn't test actual login UI

### UI Flow (Full Login)

Use `loginViaBCSC()` or `loginViaBCeID()` to test the complete login experience:

```typescript
import { loginViaBCSC } from "../auth";

test("BCSC login", async ({ page }) => {
  await loginViaBCSC(
    page,
    process.env.PROPONENT_BCSC_USERNAME!,
    process.env.PROPONENT_BCSC_PASSWORD!,
  );
  // Now on dashboard
});
```

**Pros**: Tests actual user experience, validates full auth flow
**Cons**: Slower than ROPC

### Using Fixtures (Easiest)

Fixtures handle authentication automatically:

```typescript
import { test } from "../../fixtures/db.fixtures";

test("my test", async ({ authenticatedProponentWithProject }) => {
  // Already authenticated and navigated to project dashboard!
});
```

**Example**: See [db.fixtures.ts](fixtures/db.fixtures.ts) for available fixtures.

## Debugging

### 1. Interactive UI Mode (Best)

```bash
npm run test:ui
```

Click through tests, inspect elements, step through actions visually.

### 2. Debug Mode

```bash
npm run test:debug
```

Opens Playwright Inspector with step-through debugging.

### 3. Check Container Logs

```bash
# If services aren't starting
docker compose -f docker-compose.e2e.yml logs api
docker compose -f docker-compose.e2e.yml logs web
```

### 4. View HTML Report

```bash
npm run test:report
```

Shows test results with screenshots and errors.

## Common Issues

### Services Not Starting

```bash
# Clean restart
docker compose -f docker-compose.e2e.yml down -v
docker compose -f docker-compose.e2e.yml up -d

# Check status
docker compose -f docker-compose.e2e.yml ps
```

### Environment Variables Not Loading

- Verify `.env.playwright` exists in `submit-web/`
- Check for typos in credential names
- No trailing spaces in values

### Browser Not Installed

```bash
npx playwright install chromium
```

### Tests Timing Out

- Wait for services to be healthy (~2 minutes)
- Check containers are running: `docker ps`
- Verify web accessible: `curl http://localhost:5173`

### Seeding Failures

```bash
# Test seeding manually
docker compose -f docker-compose.e2e.yml exec api \
  python scripts/seed_e2e_data.py --guid test-123
```

## CI/CD

Tests run in GitHub Actions via workflow dispatch. Required secrets:

- `CYPRESS_STAFF_USERNAME` / `CYPRESS_STAFF_PASSWORD`
- `CYPRESS_PROPONENT_USERNAME` / `CYPRESS_PROPONENT_PASSWORD`
- `CYPRESS_PROPONENT_BCSC_USERNAME` / `CYPRESS_PROPONENT_BCSC_PASSWORD`
- `CYPRESS_PROPONENT_BCEID_USERNAME` / `CYPRESS_PROPONENT_BCEID_PASSWORD`

## Resources

- **Playwright Docs**: https://playwright.dev
- **Best Practices**: https://playwright.dev/docs/best-practices
- **Trace Viewer**: https://trace.playwright.dev
- **VS Code Extension**: Recommended for debugging

---

**Last Updated**: January 2025
**Status**: Production E2E Framework
**Quick Links**:

- Run tests: `docker compose -f docker-compose.e2e.yml up -d && npm run test:ui`
- Docs: https://playwright.dev
- Examples: [submit-web/playwright/e2e/submissions/](e2e/submissions/)
