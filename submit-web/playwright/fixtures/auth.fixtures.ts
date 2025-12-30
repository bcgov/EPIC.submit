/**
 * Authentication Fixtures
 * Reusable Playwright fixtures for authenticated test contexts
 */

import { test as base, Page } from '@playwright/test';
import { kcLogin, kcLogout } from '../auth';

/**
 * Extended test context with authenticated user states
 */
type AuthFixtures = {
  authenticatedStaff: Page;
  authenticatedProponent: Page;
};

/**
 * Playwright test with authentication fixtures
 *
 * Usage:
 * ```typescript
 * import { test } from '../fixtures/auth.fixtures';
 *
 * test('staff can view dashboard', async ({ authenticatedStaff }) => {
 *   await authenticatedStaff.goto('/staff/dashboard');
 *   await expect(authenticatedStaff).toHaveURL(/\/staff/);
 * });
 * ```
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Fixture: Authenticated staff user
   * Automatically logs in as staff before the test
   */
  authenticatedStaff: async ({ page }, use) => {
    const username = process.env.STAFF_USERNAME || '';
    const password = process.env.STAFF_PASSWORD || '';

    // Setup: Login as staff
    await kcLogout(page);
    await kcLogin(page, username, password);

    // Provide page to test
    await use(page);

    // Teardown: Logout
    await kcLogout(page);
  },

  /**
   * Fixture: Authenticated proponent user
   * Automatically logs in as proponent before the test
   */
  authenticatedProponent: async ({ page }, use) => {
    const username = process.env.PROPONENT_USERNAME || '';
    const password = process.env.PROPONENT_PASSWORD || '';

    // Setup: Login as proponent
    await kcLogout(page);
    await kcLogin(page, username, password);

    // Provide page to test
    await use(page);

    // Teardown: Logout
    await kcLogout(page);
  },
});

export { expect } from '@playwright/test';
