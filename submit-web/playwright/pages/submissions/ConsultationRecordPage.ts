import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";

/**
 * Consultation Record Form Page Object
 * Represents the Consultation Record form page with file uploads
 */
export class ConsultationRecordPage extends BasePage {
  // Form field locators
  readonly consultedPartiesInput: Locator;
  readonly allPartiesConsultedYes: Locator;
  readonly allPartiesConsultedNo: Locator;
  readonly planWasReviewedYes: Locator;
  readonly planWasReviewedNo: Locator;
  readonly writtenExplanationsToPartiesYes: Locator;
  readonly writtenExplanationsToPartiesNo: Locator;
  readonly writtenExplanationsToCommentersYes: Locator;
  readonly writtenExplanationsToCommentersNo: Locator;
  readonly notesTextarea: Locator;

  // File upload locators
  readonly uploader: Locator;
  readonly fileInput: Locator;
  readonly documentTable: Locator;

  // Button locators
  readonly saveAndContinueButton: Locator;
  readonly saveCompletedButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Form fields
    this.consultedPartiesInput = page.getByPlaceholder(
      /Enter the name of other consulted party here/i,
    );

    // Radio buttons - using getByLabel for Yes/No options
    // Note: These may need adjustment based on actual form structure
    this.allPartiesConsultedYes = page
      .locator('input[type="radio"][value="true"]')
      .first();
    this.allPartiesConsultedNo = page
      .locator('input[type="radio"][value="false"]')
      .first();
    this.planWasReviewedYes = page
      .locator('input[type="radio"][value="true"]')
      .nth(1);
    this.planWasReviewedNo = page
      .locator('input[type="radio"][value="false"]')
      .nth(1);
    this.writtenExplanationsToPartiesYes = page
      .locator('input[type="radio"][value="true"]')
      .nth(2);
    this.writtenExplanationsToPartiesNo = page
      .locator('input[type="radio"][value="false"]')
      .nth(2);
    this.writtenExplanationsToCommentersYes = page
      .locator('input[type="radio"][value="true"]')
      .nth(3);
    this.writtenExplanationsToCommentersNo = page
      .locator('input[type="radio"][value="false"]')
      .nth(3);

    this.notesTextarea = page.getByLabel(/Notes\/Comments/i);

    // File upload
    this.uploader = page.locator('[data-cy="uploader"]');
    this.fileInput = page.locator('input[type="file"]');
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
   * Fill consultation record form
   *
   * @param data - Consultation record data
   */
  async fillConsultationRecord(data: {
    consultedParties?: string[];
    allPartiesConsulted: boolean;
    planWasReviewed: boolean;
    writtenExplanationsToParties: boolean;
    writtenExplanationsToCommenters: boolean;
    notes?: string;
  }): Promise<void> {
    // Add consulted parties if provided
    if (data.consultedParties && data.consultedParties.length > 0) {
      for (const party of data.consultedParties) {
        await this.consultedPartiesInput.fill(party);
        await this.consultedPartiesInput.press("Enter"); // Assuming Enter adds the party
        await this.page.waitForTimeout(500); // Small wait for chip to appear
      }
    }

    // Fill radio buttons
    if (data.allPartiesConsulted) {
      await this.allPartiesConsultedYes.check();
    } else {
      await this.allPartiesConsultedNo.check();
    }

    if (data.planWasReviewed) {
      await this.planWasReviewedYes.check();
    } else {
      await this.planWasReviewedNo.check();
    }

    if (data.writtenExplanationsToParties) {
      await this.writtenExplanationsToPartiesYes.check();
    } else {
      await this.writtenExplanationsToPartiesNo.check();
    }

    if (data.writtenExplanationsToCommenters) {
      await this.writtenExplanationsToCommentersYes.check();
    } else {
      await this.writtenExplanationsToCommentersNo.check();
    }

    // Fill notes if provided
    if (data.notes) {
      await this.notesTextarea.fill(data.notes);
    }
  }

  /**
   * Upload consultation record files
   *
   * @param filePaths - Array of absolute file paths to upload
   */
  async uploadFiles(filePaths: string[]): Promise<void> {
    // Set files on hidden file input
    await this.fileInput.setInputFiles(filePaths);

    // Wait for document table to show uploaded files
    // Wait for at least one row to appear in the document table
    await this.page.waitForSelector(
      '[data-testid="document-table"] tbody tr',
      {
        state: "visible",
        timeout: 15000,
      },
    );

    // Wait a bit for upload to complete (no progress spinner)
    await this.page.waitForTimeout(2000);
  }

  /**
   * Save form and continue later (keeps status as in progress)
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
   * Verify we're on the consultation record page
   */
  async verifyOnConsultationRecordPage(): Promise<void> {
    await expect(this.consultedPartiesInput).toBeVisible();
    await expect(this.saveCompletedButton).toBeVisible();
  }
}
