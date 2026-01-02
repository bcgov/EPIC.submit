import { test, expect } from "@playwright/test";
import {
  seedAccount,
  seedProponentUser,
  cleanupTestData,
} from "../../helpers/seed";
import { kcLogout, loginViaBCSC } from "../../auth";

test.describe("Proponent User Login via BCSC (UI Flow)", () => {
  const testGuid = "71cb238c-147e-4d6b-85d1-de7f8659f049";
  const testProponentId = 8888;
  const testAccountId = 5555;

  test.beforeEach(async ({ page }) => {
    // Seed account first
    seedAccount(testProponentId, { accountId: testAccountId });

    // Seed test user
    seedProponentUser(testGuid, testAccountId);

    await kcLogout(page);
  });

  test.afterEach(() => {
    // Cleanup test data after each test
    cleanupTestData({ guid: testGuid, proponentId: testProponentId });
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
