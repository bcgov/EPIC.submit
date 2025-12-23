import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Plan Details Form Page Object
 * Represents the confirmation step of new submission creation
 */
export class PlanDetailsFormPage extends BasePage {
  // Locators
  readonly planNameDisplay: Locator;
  readonly confirmationRadioYes: Locator;
  readonly confirmationRadioNo: Locator;
  readonly createSubmissionButton: Locator;
  readonly backButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);

    // Plan details display
    this.planNameDisplay = page.locator('[data-testid="plan-name"]');

    // Confirmation radio buttons
    this.confirmationRadioYes = page.getByRole('radio', { name: /Yes|Correct/i });
    this.confirmationRadioNo = page.getByRole('radio', { name: /No|Incorrect/i });

    // Actions
    this.createSubmissionButton = page.getByRole('button', { name: /Create.*Submission/i });
    this.backButton = page.getByRole('button', { name: /Back/i });
    this.cancelButton = page.getByRole('button', { name: /Cancel/i });
  }

  /**
   * Verify user is on plan details form
   */
  async verifyOnPlanDetailsForm(): Promise<void> {
    await expect(this.createSubmissionButton).toBeVisible();
  }

  /**
   * Verify displayed plan name
   */
  async verifyPlanName(expectedName: string): Promise<void> {
    await expect(this.page.getByText(expectedName)).toBeVisible();
  }

  /**
   * Confirm details are correct
   */
  async confirmDetailsCorrect(): Promise<void> {
    await this.confirmationRadioYes.check();
  }

  /**
   * Click Create Submission button
   */
  async clickCreateSubmission(): Promise<void> {
    await this.createSubmissionButton.click();
    // Wait for creation to complete (loading state)
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click Back to return to conditions
   */
  async clickBack(): Promise<void> {
    await this.backButton.click();
    await this.waitForReady();
  }

  /**
   * Complete plan details form and create submission
   */
  async confirmAndCreateSubmission(): Promise<void> {
    await this.confirmDetailsCorrect();
    await this.clickCreateSubmission();
  }
}
