import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";

/**
 * Submission Package Page Object
 * Represents /proponent/projects/:projectId/submission-packages/:packageId
 */
export class SubmissionPackagePage extends BasePage {
  // Locators
  readonly packageTitle: Locator;
  readonly packageStatus: Locator;
  readonly itemsTable: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.packageTitle = page.getByRole("heading", { level: 1 });
    this.packageStatus = page.locator('[data-testid="package-status"]');
    this.itemsTable = page.locator('[data-testid="items-table"]');
    this.successMessage = page.getByText(/successfully created/i);
  }

  /**
   * Verify user is on submission package page
   */
  async verifyOnSubmissionPackage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/submission-packages\/\d+/);
  }

  /**
   * Verify package was created successfully
   */
  async verifyPackageCreated(packageName?: string): Promise<void> {
    await this.verifyOnSubmissionPackage();

    if (packageName) {
      await expect(this.packageTitle).toContainText(packageName);
    }
  }

  /**
   * Verify success message
   */
  async verifySuccessMessage(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * Get package ID from URL
   */
  getPackageIdFromUrl(): number {
    const url = this.getCurrentUrl();
    const match = url.match(/submission-packages\/(\d+)/);
    if (!match) {
      throw new Error("Could not extract package ID from URL");
    }
    return parseInt(match[1], 10);
  }

  /**
   * Click on an item to navigate to its form
   *
   * @param itemName - Name of the item (e.g., "Submission Contact Information", "Consultation Record")
   */
  async clickItem(itemName: string): Promise<void> {
    await this.page.getByTestId(`submission-item-action-${itemName}`).click();
    await this.waitForReady();
  }

  /**
   * Navigate to package page
   *
   * @param accountProjectId - Account project ID
   * @param packageId - Package ID
   */
  async navigateToPackage(
    accountProjectId: number,
    packageId: number,
  ): Promise<void> {
    await this.goto(
      `/proponent/projects/${accountProjectId}/submission-packages/${packageId}`,
    );
  }

  /**
   * Click "Submit to EAO" button to submit the package
   */
  async submitPackage(): Promise<void> {
    const submitButton = this.page.getByRole("button", {
      name: /Submit to EAO/i,
    });
    await submitButton.click();
    await this.waitForReady();
  }

  /**
   * Verify package submission was successful
   */
  async verifySubmissionSuccess(): Promise<void> {
    // Check for success message
    const successMsg = this.page.getByText(/successfully submitted/i);
    await expect(successMsg).toBeVisible({ timeout: 10000 });

    // Check for email confirmation message
    const emailMsg = this.page.getByText(/You will also receive an email/i);
    await expect(emailMsg).toBeVisible({ timeout: 10000 });
  }
}
