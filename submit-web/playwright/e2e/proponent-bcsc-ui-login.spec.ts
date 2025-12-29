import { test, expect } from "@playwright/test";
import { loginViaBCSC, kcLogout } from "../auth";
import { seedProponentUser, cleanupTestData } from "../helpers/seed";

test.describe("Proponent User Login via BCSC (UI Flow)", () => {
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

  test("should login via BC Services Card UI and access proponent dashboard", async ({
    page,
  }) => {
    const username = process.env.PROPONENT_BCSC_USERNAME || "";
    const password = process.env.PROPONENT_BCSC_PASSWORD || "";

    await loginViaBCSC(page, username, password);

    // Verify landed on proponent dashboard
    await expect(page.getByText("Projects").first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page).toHaveURL(/\/proponent/);

    // Verify user greeting appears
    await expect(page.locator("#menu-appbar")).toContainText("Hi,");
  });
});
