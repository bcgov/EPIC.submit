import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";

/**
 * Conditions Selection Form Page Object
 * Represents the first step of new submission creation
 */
export class ConditionsFormPage extends BasePage {
  // Locators
  readonly mainConditionDropdown: Locator;
  readonly supportingConditionsSection: Locator;
  readonly addSupportingConditionButton: Locator;
  readonly nextButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Main condition selector (first dropdown/select)
    this.mainConditionDropdown = page.getByTestId("main-condition");

    // Supporting conditions
    this.supportingConditionsSection = page.getByText(/Supporting Conditions/i);
    this.addSupportingConditionButton = page.getByRole("button", {
      name: /Add.*Condition/i,
    });

    // Navigation
    this.nextButton = page.getByRole("button", { name: /Next|Continue/i });
    this.cancelButton = page.getByRole("button", { name: /Cancel/i });

    // Validation
    this.errorMessage = page.locator('[role="alert"]');
  }

  /**
   * Verify user is on conditions form
   */
  async verifyOnConditionsForm(): Promise<void> {
    await expect(this.page).toHaveURL(/\/new-submission/);
    await expect(this.mainConditionDropdown).toBeVisible();
  }

  /**
   * Select main condition by name
   */
  async selectMainCondition(conditionName: string): Promise<void> {
    await this.mainConditionDropdown.click();
    await this.page.getByRole("option", { name: conditionName }).click();
  }

  /**
   * Select main condition by index (0-based)
   */
  async selectMainConditionByIndex(index: number): Promise<void> {
    await this.mainConditionDropdown.click();

    // wait for options to be loaded
    await this.page.waitForSelector('[role="option"]');

    const options = await this.page.getByRole("option").all();
    if (index < options.length) {
      await options[index].click();
    } else {
      throw new Error(
        `Option index ${index} out of bounds (${options.length} options available)`,
      );
    }
  }

  /**
   * Add a supporting condition
   */
  async addSupportingCondition(conditionName: string): Promise<void> {
    await this.addSupportingConditionButton.click();

    // Find the newly added dropdown (last one)
    const dropdowns = await this.page.getByLabel(/Supporting Condition/i).all();
    const lastDropdown = dropdowns[dropdowns.length - 1];

    await lastDropdown.click();
    await this.page.getByRole("option", { name: conditionName }).click();
  }

  /**
   * Click Next to proceed to plan details
   */
  async clickNext(): Promise<void> {
    await this.nextButton.click();
    await this.waitForReady();
  }

  /**
   * Click Cancel to abort
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
    await this.waitForReady();
  }

  /**
   * Verify error message is shown
   */
  async verifyErrorMessage(expectedMessage: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedMessage);
  }

  /**
   * Complete conditions form (main condition only, no supporting)
   */
  async fillConditionsForm(mainCondition: string): Promise<void> {
    await this.selectMainCondition(mainCondition);
    await this.clickNext();
  }

  /**
   * Complete conditions form with supporting conditions
   */
  async fillConditionsFormWithSupporting(
    mainCondition: string,
    supportingConditions: string[],
  ): Promise<void> {
    await this.selectMainCondition(mainCondition);

    for (const supporting of supportingConditions) {
      await this.addSupportingCondition(supporting);
    }

    await this.clickNext();
  }
}
