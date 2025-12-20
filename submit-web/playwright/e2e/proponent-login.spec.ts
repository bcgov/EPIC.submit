import { test, expect } from "@playwright/test";
import { kcLogin, kcLogout } from "../auth";
import { seedProponentUser, cleanupTestData } from "../helpers/seed";

test.describe("Proponent User Login", () => {
  const testGuid = "71cb238c-147e-4d6b-85d1-de7f8659f049";

  test.beforeAll(async () => {
    // Seed the test proponent user with account and role
    await seedProponentUser(testGuid);
  });

  test.afterAll(async () => {
    // Cleanup test data after all tests complete
    await cleanupTestData({ guid: testGuid });
  });

  test.beforeEach(async ({ page }) => {
    await kcLogout(page);
  });

  test("should login as proponent and access dashboard", async ({ page }) => {
    const username = process.env.PROPONENT_USERNAME || "";
    const password = process.env.PROPONENT_PASSWORD || "";

    await kcLogin(page, username, password);

    await page.goto("/");

    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/proponent/);
  });
});
