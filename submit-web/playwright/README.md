# Playwright E2E Tests

## Quick Start

1. **Install browsers** (first time only):
   ```bash
   npx playwright install chromium
   ```

2. **Set up credentials**:
   ```bash
   cp .env.playwright.template .env.playwright
   # Edit .env.playwright with your test credentials
   ```

3. **Run tests**:
   ```bash
   npm run pw:ui    # Interactive UI mode
   npm run pw:test  # Headless mode
   ```

## Available Scripts

- `npm run pw:ui` - Open Playwright UI (recommended)
- `npm run pw:test` - Run all tests headless
- `npm run pw:headed` - Run tests with browser visible
- `npm run pw:debug` - Run tests in debug mode
- `npm run pw:report` - View last test report

## Tests

- [staff-login.spec.ts](e2e/staff-login.spec.ts) - Staff ROPC login
- [proponent-login.spec.ts](e2e/proponent-login.spec.ts) - Proponent ROPC login
- [proponent-bcsc-ui-login.spec.ts](e2e/proponent-bcsc-ui-login.spec.ts) - BCSC UI flow
- [proponent-bceid-ui-login.spec.ts](e2e/proponent-bceid-ui-login.spec.ts) - BCeID UI flow (skipped)

## Documentation

See [PLAYWRIGHT_TESTING_GUIDE.md](PLAYWRIGHT_TESTING_GUIDE.md) for comprehensive documentation.

## Configuration

- **Config**: [../playwright.config.ts](../playwright.config.ts)
- **Environment**: [../.env.playwright](../.env.playwright)
- **Auth helpers**: [auth.ts](auth.ts)
