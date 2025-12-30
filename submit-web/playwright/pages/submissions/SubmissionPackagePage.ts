import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

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

    this.packageTitle = page.getByRole('heading', { level: 1 });
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
      throw new Error('Could not extract package ID from URL');
    }
    return parseInt(match[1], 10);
  }
}
