import { test, expect } from "@playwright/test";
import { kcLogin, kcLogout } from "../../auth";

const INVITATION_TOKEN = "e2e-test-invitation-token-uuid";

test.describe.skip("Proponent Onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await kcLogout(page);
  });

  test("complete proponent registration and access dashboard", async ({
    page,
  }) => {
    // ================================================================
    // PART 1: Complete Proponent Registration
    // ================================================================

    // Navigate to registration with seeded invitation token
    await page.goto(`/proponent/registration/?token=${INVITATION_TOKEN}`);

    // Authenticate via OIDC (uses real Keycloak)
    await kcLogin(
      page,
      process.env.PROPONENT_USERNAME!,
      process.env.PROPONENT_PASSWORD!,
    );

    // Should land on registration form
    await expect(page).toHaveURL(/\/proponent\/registration/);
    await expect(page.getByText(/Create Account/i)).toBeVisible();

    // Fill registration form
    await page.getByLabel(/Given Name/i).fill("E2E Test");
    await page.getByLabel(/Surname/i).fill("Proponent User");
    await page.getByLabel(/Position/i).fill("QA Engineer");
    await page.getByLabel(/Work Email/i).fill("proponent.test@example.com");
    await page.getByLabel(/Work Phone/i).fill("250-555-1234");
    await page.getByLabel(/Extension/i).fill("123");

    // Accept terms and conditions
    await page.getByRole("checkbox", { name: /Terms/i }).check();

    // Submit registration
    await page.getByRole("button", { name: /Create Account/i }).click();
    await page.waitForLoadState("networkidle");

    // Verify "Add Projects" step appears (is_first_time = true)
    await expect(page).toHaveURL(/\/proponent\/registration/);
    await expect(page.getByText(/Coastal GasLink Pipeline/i)).toBeVisible();
    await expect(page.getByText(/Site C Clean Energy Project/i)).toBeVisible();

    // Continue to completion
    await page.getByRole("button", { name: /Continue|Next/i }).click();

    // Verify registration complete
    await expect(page).toHaveURL(/\/proponent\/registration\/complete/);
    await expect(page.getByText(/congratulations|success/i)).toBeVisible();

    // Navigate to dashboard
    await page.getByRole("link", { name: /home|dashboard/i }).click();
    await page.waitForLoadState("networkidle");

    // ================================================================
    // PART 2: Verify User Can Access Projects
    // ================================================================

    await expect(page).toHaveURL(/\/proponent/);
    await expect(page.getByText(/Coastal GasLink Pipeline/i)).toBeVisible();

    // SUBMISSION CRUD TESTS MOVED TO: e2e/submissions/create-submission.spec.ts
  });
});
