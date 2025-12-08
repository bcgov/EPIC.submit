import { test, expect } from '@playwright/test';
import { kcLogin, kcLogout } from '../auth';

test.describe('Staff User Login', () => {
  test.beforeEach(async ({ page }) => {
    await kcLogout(page);
  });

  test('should login as staff and access dashboard', async ({ page }) => {
    const username = process.env.STAFF_USERNAME || '';
    const password = process.env.STAFF_PASSWORD || '';

    await kcLogin(page, username, password);
    await page.goto('/');

    // Verify staff can see projects
    await expect(page.getByText('Projects')).toBeVisible({ timeout: 15000 });

    // Verify URL is staff or projects page
    await expect(page).toHaveURL(/\/(staff|projects)/);
  });
});
