import { test, expect } from "@playwright/test";
import { loginViaBCeID, kcLogout } from "../../auth";

test.describe.skip("Proponent User Login via BCeID (UI Flow)", () => {
  test.beforeEach(async ({ page }) => {
    await kcLogout(page);
  });

  test("should login via BCeID UI and access proponent dashboard", async ({
    page,
  }) => {
    const username = process.env.PROPONENT_BCEID_USERNAME || "";
    const password = process.env.PROPONENT_BCEID_PASSWORD || "";

    await loginViaBCeID(page, username, password);

    // Verify landed on proponent dashboard
    await expect(page.getByText("Projects")).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/proponent/);

    // Verify user greeting appears
    await expect(page.locator("#menu-appbar")).toContainText("Hi,");
  });
});
