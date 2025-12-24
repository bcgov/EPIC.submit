import { test, expect } from "@playwright/test";
import { kcLogin, kcLogout } from "../../auth";
import {
  seedAccount,
  seedProponentUser,
  cleanupTestData,
} from "../../helpers/seed";

test.describe("Proponent User Login", () => {
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

  test("should login as proponent and access dashboard", async ({ page }) => {
    const username = process.env.PROPONENT_USERNAME || "";
    const password = process.env.PROPONENT_PASSWORD || "";

    await kcLogin(page, username, password);

    await page.goto("/");

    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/proponent/);
  });
});
