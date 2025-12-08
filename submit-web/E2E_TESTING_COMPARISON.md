# E2E Testing Framework Comparison

## Overview

This project includes **both Cypress and Playwright** E2E testing implementations for the same test scenarios. This allows the team to evaluate both frameworks side-by-side before choosing one.

## Quick Comparison

| Aspect | Cypress | Playwright |
|--------|---------|-----------|
| **Setup** | ✅ Mature, well-documented | ✅ Modern, excellent docs |
| **Speed** | ⚡ Fast | ⚡⚡ Generally faster |
| **Cross-origin** | ⚠️ Requires workarounds | ✅ Native support |
| **Debugging** | ✅ Excellent time-travel | ✅ Excellent trace viewer |
| **Community** | ✅ Large, established | ✅ Growing rapidly |
| **Parallelization** | ⚠️ Requires Dashboard (paid) | ✅ Built-in, free |
| **Browser support** | Chrome, Firefox, Edge | Chromium, Firefox, WebKit |
| **Learning curve** | Gentle | Gentle |
| **Test stability** | ✅ Good auto-waiting | ✅ Great auto-waiting |

## Test Coverage (Both Frameworks)

Both implementations include identical test scenarios:

1. **Staff Login (ROPC)** - Fast token-based authentication
2. **Proponent Login (ROPC)** - Fast token-based authentication
3. **BCSC UI Login** - Full browser-based authentication flow
4. **BCeID UI Login** - Full browser-based authentication (currently skipped in both)

## Running Tests

### Cypress

```bash
# Interactive mode (recommended for demo)
npm run cy:open

# Headless mode
npx cypress run --e2e

# Specific test
npx cypress run --spec "cypress/e2e/proponent-bcsc-ui-login.cy.ts"
```

**Config**: [cypress.config.cjs](cypress.config.cjs)
**Tests**: [cypress/e2e/](cypress/e2e/)
**Credentials**: [cypress.env.json](cypress.env.json) (copy from template)
**Docs**: [cypress/E2E_TESTING_CONTEXT.md](cypress/E2E_TESTING_CONTEXT.md)

### Playwright

```bash
# Interactive UI mode (recommended for demo)
npm run pw:ui

# Headless mode
npm run pw:test

# Headed mode (see browser)
npm run pw:headed

# Debug mode
npm run pw:debug

# View report
npm run pw:report
```

**Config**: [playwright.config.ts](playwright.config.ts)
**Tests**: [playwright/e2e/](playwright/e2e/)
**Credentials**: [.env.playwright](.env.playwright) (copy from template)
**Docs**: [playwright/PLAYWRIGHT_TESTING_GUIDE.md](playwright/PLAYWRIGHT_TESTING_GUIDE.md)

## Setup Instructions

### Cypress Setup

1. Copy environment template:
   ```bash
   cp cypress.env.json.template cypress.env.json
   ```

2. Fill in test credentials in `cypress.env.json`

3. Run tests:
   ```bash
   npm run cy:open
   ```

### Playwright Setup

1. Copy environment template:
   ```bash
   cp .env.playwright.template .env.playwright
   ```

2. Fill in test credentials in `.env.playwright`

3. Install browsers (first time):
   ```bash
   npx playwright install chromium
   ```

4. Run tests:
   ```bash
   npm run pw:ui
   ```

## Key Differences in Implementation

### Cross-Origin Authentication (BCSC/BCeID)

**Cypress**:
```typescript
// Requires chromeWebSecurity: false OR cy.origin()
cy.get("#bcsc-login").click();
cy.get("#username").type(username); // Works due to chromeWebSecurity: false
```

**Playwright**:
```typescript
// Native cross-origin support, no special config needed
await page.locator("#bcsc-login").click();
await page.locator("#username").fill(username); // Just works
```

### Test Syntax

**Cypress**:
```typescript
describe('My Test', () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it('should login', () => {
    cy.kcLogin('user', 'pass');
    cy.visit('/');
    cy.contains('Projects').should('be.visible');
    cy.url().should('include', '/dashboard');
  });
});
```

**Playwright**:
```typescript
test.describe('My Test', () => {
  test.beforeEach(async ({ page }) => {
    await kcLogout(page);
  });

  test('should login', async ({ page }) => {
    await kcLogin(page, 'user', 'pass');
    await page.goto('/');
    await expect(page.getByText('Projects')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

### Configuration

**Cypress** ([cypress.config.cjs](cypress.config.cjs)):
- JavaScript config file
- Environment vars from `cypress.env.json`
- Cross-origin requires `chromeWebSecurity: false`

**Playwright** ([playwright.config.ts](playwright.config.ts)):
- TypeScript config file
- Environment vars from `.env.playwright`
- Cross-origin works out of the box

## Demo Script

### Part 1: Show Test Runner UIs

1. **Cypress UI**:
   ```bash
   npm run cy:open
   ```
   - Show test selection
   - Run BCSC UI login test
   - Show time-travel debugging
   - Show test replay

2. **Playwright UI**:
   ```bash
   npm run pw:ui
   ```
   - Show test selection
   - Run BCSC UI login test
   - Show trace viewer
   - Show timeline and network activity

### Part 2: Show Code Comparison

Open side-by-side:
- [cypress/e2e/proponent-bcsc-ui-login.cy.ts](cypress/e2e/proponent-bcsc-ui-login.cy.ts)
- [playwright/e2e/proponent-bcsc-ui-login.spec.ts](playwright/e2e/proponent-bcsc-ui-login.spec.ts)

Point out:
- Similar test structure
- Async/await vs chaining
- Native cross-origin in Playwright

### Part 3: Show CI/CD

Open workflows:
- [.github/workflows/e2e.yml](.github/workflows/e2e.yml) - Cypress
- [.github/workflows/e2e-playwright.yml](.github/workflows/e2e-playwright.yml) - Playwright

Point out:
- Similar setup
- Playwright needs browser installation step
- Both use same secrets
- Similar artifact uploading

### Part 4: Run Both in Parallel

Terminal 1:
```bash
npm run cy:open
```

Terminal 2:
```bash
npm run pw:ui
```

Run the same test in both and compare:
- Test execution speed
- Debugging experience
- Error messages
- Reporting

## Decision Criteria

Consider these factors when choosing:

### Choose Cypress if:
- ✅ Team prefers established, mature tooling
- ✅ Large community and plugin ecosystem is important
- ✅ Time-travel debugging is highly valued
- ✅ Sync syntax feels more natural
- ✅ Don't need WebKit/Safari testing

### Choose Playwright if:
- ✅ Cross-origin testing is frequent
- ✅ Free built-in parallelization is important
- ✅ Need WebKit/Safari testing
- ✅ Prefer TypeScript-first approach
- ✅ Want trace viewer for debugging
- ✅ Need slightly better performance

## CI/CD Workflows

### Cypress
**Workflow**: `.github/workflows/e2e.yml`
- Runs on manual dispatch
- Uses Chromium
- Uploads screenshots and videos on failure

### Playwright
**Workflow**: `.github/workflows/e2e-playwright.yml`
- Runs on manual dispatch
- Uses Chromium (configurable for Firefox/WebKit)
- Uploads HTML report and test results

Both use the same GitHub secrets for credentials.

## Next Steps

After team review and decision:

### If choosing Cypress:
```bash
# Remove Playwright
rm -rf playwright/
rm playwright.config.ts
rm .env.playwright .env.playwright.template
rm .github/workflows/e2e-playwright.yml
# Update package.json to remove pw:* scripts
```

### If choosing Playwright:
```bash
# Remove Cypress
rm -rf cypress/
rm cypress.config.cjs
rm cypress.env.json cypress.env.json.template
rm .github/workflows/e2e.yml
# Update package.json to remove cy:* scripts
```

Update documentation to reflect the chosen framework.

## Resources

### Cypress
- [Official Docs](https://docs.cypress.io)
- [E2E Testing Context](cypress/E2E_TESTING_CONTEXT.md)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)

### Playwright
- [Official Docs](https://playwright.dev)
- [Testing Guide](playwright/PLAYWRIGHT_TESTING_GUIDE.md)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

**Last Updated**: December 2024
**Status**: Both frameworks ready for comparison demo
**Next Action**: Demo to team and choose one framework
