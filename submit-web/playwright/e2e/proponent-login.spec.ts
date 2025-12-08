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

    // Verify proponent can see projects
    await expect(page.getByText("Projects").first()).toBeVisible({
      timeout: 15000,
    });

    // Verify URL is proponent or projects page
    await expect(page).toHaveURL(/\/(proponent|projects)/);
  });
});
