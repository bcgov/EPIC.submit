import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";

/**
 * Management Plan Form Page Object
 * Represents the Management Plan submission form page with file uploads
 */
export class ManagementPlanPage extends BasePage {
  // Radio button locators
  readonly conditionSatisfiedYes: Locator;
  readonly conditionSatisfiedNo: Locator;
  readonly allRequirementsAddressedYes: Locator;
  readonly allRequirementsAddressedNo: Locator;
  readonly informationAccurateYes: Locator;
  readonly informationAccurateNo: Locator;

  // Notes field
  readonly notesTextarea: Locator;

  // File upload locators
  readonly managementPlanFileInput: Locator;
  readonly supportingDocsFileInput: Locator;
  readonly documentTable: Locator;

  // Button locators
  readonly saveAndContinueButton: Locator;
  readonly saveCompletedButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Radio buttons for Yes/No questions
    // Note: Using nth() to differentiate between multiple radio groups
    this.conditionSatisfiedYes = page
      .locator('input[type="radio"][value="true"]')
      .first();
    this.conditionSatisfiedNo = page
      .locator('input[type="radio"][value="false"]')
      .first();
    this.allRequirementsAddressedYes = page
      .locator('input[type="radio"][value="true"]')
      .nth(1);
    this.allRequirementsAddressedNo = page
      .locator('input[type="radio"][value="false"]')
      .nth(1);
    this.informationAccurateYes = page
      .locator('input[type="radio"][value="true"]')
      .nth(2);
    this.informationAccurateNo = page
      .locator('input[type="radio"][value="false"]')
      .nth(2);

    // Notes field
    this.notesTextarea = page.getByLabel(/Notes\/Comments/i);

    // File inputs
    // Note: There are typically two separate file upload sections in Management Plan form
    this.managementPlanFileInput = page.locator('input[type="file"]').first();
    this.supportingDocsFileInput = page.locator('input[type="file"]').last();
    this.documentTable = page.locator('[data-testid="document-table"]');

    // Buttons
    this.saveAndContinueButton = page.getByRole("button", {
      name: /Save & Continue Later/i,
    });
    this.saveCompletedButton = page.getByRole("button", {
      name: /Save Completed Form/i,
    });
    this.successMessage = page.getByText(/Submission saved successfully/i);
  }

  /**
   * Fill management plan form
   *
   * @param data - Management plan form data
   */
  async fillManagementPlan(data: {
    conditionSatisfied: boolean;
    allRequirementsAddressed: boolean;
    informationAccurate: boolean;
    notes?: string;
  }): Promise<void> {
    // Fill radio buttons
    if (data.conditionSatisfied) {
      await this.conditionSatisfiedYes.check();
    } else {
      await this.conditionSatisfiedNo.check();
    }

    if (data.allRequirementsAddressed) {
      await this.allRequirementsAddressedYes.check();
    } else {
      await this.allRequirementsAddressedNo.check();
    }

    if (data.informationAccurate) {
      await this.informationAccurateYes.check();
    } else {
      await this.informationAccurateNo.check();
    }

    // Fill notes if provided
    if (data.notes) {
      await this.notesTextarea.fill(data.notes);
    }
  }

  /**
   * Upload management plan file (max 1 file)
   *
   * @param filePath - Absolute file path to the management plan PDF
   */
  async uploadManagementPlan(filePath: string): Promise<void> {
    // Upload to the first file input (Management Plan section)
    await this.managementPlanFileInput.setInputFiles([filePath]);

    // Wait for document to appear in table
    await this.page.waitForSelector(
      '[data-testid="document-table"] tbody tr',
      {
        state: "visible",
        timeout: 15000,
      },
    );

    // Wait for upload to complete
    await this.page.waitForTimeout(2000);
  }

  /**
   * Upload supporting documents (max 10 files)
   *
   * @param filePaths - Array of absolute file paths to supporting documents
   */
  async uploadSupportingDocuments(filePaths: string[]): Promise<void> {
    // Upload to the second file input (Supporting Documents section)
    await this.supportingDocsFileInput.setInputFiles(filePaths);

    // Wait for documents to appear in table
    // We should see at least the number of files we uploaded
    await this.page.waitForTimeout(2000);

    // Optional: verify the expected number of rows
    const rows = await this.page
      .locator('[data-testid="document-table"] tbody tr')
      .count();
    if (rows < filePaths.length) {
      console.warn(
        `Expected at least ${filePaths.length} documents in table, but found ${rows}`,
      );
    }
  }

  /**
   * Save form and continue later
   */
  async saveAndContinueLater(): Promise<void> {
    await this.saveAndContinueButton.click();
    await this.waitForReady();
  }

  /**
   * Save form as completed
   */
  async saveAndComplete(): Promise<void> {
    await this.saveCompletedButton.click();
    await this.waitForReady();
  }

  /**
   * Verify form was saved successfully
   */
  async verifySaved(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify we're on the management plan page
   */
  async verifyOnManagementPlanPage(): Promise<void> {
    await expect(this.conditionSatisfiedYes).toBeVisible();
    await expect(this.saveCompletedButton).toBeVisible();
  }
}
