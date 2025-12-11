import { test, expect } from "@playwright/test";
import { kcLogin, kcLogout } from "../auth";

test.describe("Proponent User Login", () => {
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
