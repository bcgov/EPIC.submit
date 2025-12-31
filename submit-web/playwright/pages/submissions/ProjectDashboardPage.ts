import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";

/**
 * Project Dashboard Page Object
 * Represents /proponent/projects/:accountProjectId
 */
export class ProjectDashboardPage extends BasePage {
  // Locators
  readonly newSubmissionButton: Locator;
  readonly projectTitle: Locator;
  readonly activeSubmissionsSection: Locator;
  readonly pastSubmissionsSection: Locator;

  constructor(page: Page) {
    super(page);

    // Button with AddIcon and "New Submission" text
    this.newSubmissionButton = page.getByRole("button", {
      name: /New Submission/i,
    });

    // Project info
    this.projectTitle = page.getByRole("heading", { level: 1 });

    // Sections
    this.activeSubmissionsSection = page.getByText(/Active Submissions/i);
    this.pastSubmissionsSection = page.getByText(
      /Review Completed by the EAO/i,
    );
  }

  /**
   * Navigate to project dashboard
   */
  async navigateToProject(accountProjectId: number): Promise<void> {
    await this.goto(`/proponent/projects/${accountProjectId}`);
  }

  /**
   * Verify user is on project dashboard
   */
  async verifyOnProjectDashboard(
    accountProjectId: number,
    expectedProjectName?: string,
  ): Promise<void> {
    await expect(this.page).toHaveURL(/\/proponent\/projects\/\d+/);
    await expect(this.newSubmissionButton).toBeVisible();

    if (expectedProjectName) {
      await expect(
        this.page
          .getByTestId(`project-${accountProjectId}`)
          .getByText(expectedProjectName),
      ).toBeVisible();
    }
  }

  /**
   * Click "New Submission" button
   */
  async clickNewSubmission(): Promise<void> {
    await this.newSubmissionButton.click();
    await this.waitForReady();
  }

  /**
   * Get number of active submissions
   */
  async getActiveSubmissionsCount(): Promise<number> {
    // This would query the table rows in active submissions section
    const rows = await this.page
      .locator('[data-testid="active-submissions-table"] tbody tr')
      .count();
    return rows;
  }
}
