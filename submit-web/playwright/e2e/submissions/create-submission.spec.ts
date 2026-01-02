/**
 * Submission Creation E2E Test
 *
 * Tests the complete submission creation flow using:
 * - Page Object Model for UI interactions
 * - Fixtures for automatic data seeding and authentication
 * - Clean separation of test logic from implementation details
 *
 * Prerequisites (handled by fixtures):
 * - Seeded proponent user with account
 * - Seeded project linked to account
 * - Authenticated session
 */

import { test, expect } from "../../fixtures/db.fixtures";
import {
  ProjectDashboardPage,
  ConditionsFormPage,
  PlanDetailsFormPage,
  SubmissionPackagePage,
} from "../../pages/submissions";

test.describe("Submission Creation", () => {
  /**
   * Demonstrates the power of fixtures:
   * - No manual seeding in beforeEach
   * - No manual login
   * - No manual navigation to starting page
   * - Everything is ready to go!
   */

  test("proponent can create a new submission package", async ({
    authenticatedProponentWithProject,
  }) => {
    // Fixture has already:
    // 1. Seeded proponent user
    // 2. Seeded project
    // 3. Linked account to project
    // 4. Authenticated user
    // 5. Navigated to project dashboard

    const { page, accountProjectId } = authenticatedProponentWithProject;

    // Initialize Page Objects
    const dashboardPage = new ProjectDashboardPage(page);
    const conditionsPage = new ConditionsFormPage(page);
    const planDetailsPage = new PlanDetailsFormPage(page);
    const packagePage = new SubmissionPackagePage(page);

    // Step 1: Verify we're on project dashboard
    await dashboardPage.verifyOnProjectDashboard(
      accountProjectId,
      "Coastal GasLink Pipeline",
    );

    // Step 2: Click "New Submission"
    await dashboardPage.clickNewSubmission();

    // Step 3: Verify conditions form loaded
    await conditionsPage.verifyOnConditionsForm();

    // Step 4: Select main condition (first available)
    await conditionsPage.selectMainConditionByIndex(0);

    // Step 5: Proceed to plan details
    await conditionsPage.clickNext();

    // Step 6: Verify plan details form
    await planDetailsPage.verifyOnPlanDetailsForm();

    // Step 7: Confirm and create submission
    await planDetailsPage.confirmAndCreateSubmission();

    // Step 8: Verify submission package was created
    await packagePage.verifyPackageCreated();

    // Step 9: Verify we're redirected to package page
    const packageId = packagePage.getPackageIdFromUrl();
    expect(packageId).toBeGreaterThan(0);

    // Step 10: Verify URL structure
    await expect(page).toHaveURL(
      `/proponent/projects/${accountProjectId}/submission-packages/${packageId}`,
    );
  });
});
