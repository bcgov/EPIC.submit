import { test, expect } from "@playwright/test";
import { loginViaBCSC, kcLogout } from "../auth";

test.describe("Proponent User Login via BCSC (UI Flow)", () => {
  test.beforeEach(async ({ page }) => {
    await kcLogout(page);
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
