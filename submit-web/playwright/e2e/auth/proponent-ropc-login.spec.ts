import { test, expect } from "@playwright/test";
import { kcLogin, kcLogout } from "../../auth";
import { seedProponentUser, cleanupTestData } from "../../helpers/seed";

test.describe("Proponent User Login", () => {
  const testGuid = "71cb238c-147e-4d6b-85d1-de7f8659f049";

  test.beforeEach(async ({ page }) => {
    // Seed test user before each test
    seedProponentUser(testGuid);

    await kcLogout(page);
  });

  test.afterEach(() => {
    // Cleanup test data after each test
    cleanupTestData({ guid: testGuid });
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
