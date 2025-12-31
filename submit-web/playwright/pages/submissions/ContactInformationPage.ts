import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../BasePage";

/**
 * Contact Information Form Page Object
 * Represents the Submission Contact Information form page
 */
export class ContactInformationPage extends BasePage {
  // Primary contact fields
  readonly primaryContactDropdown: Locator;
  readonly primaryGivenName: Locator;
  readonly primarySurname: Locator;
  readonly primaryCompany: Locator;
  readonly primaryPosition: Locator;
  readonly primaryPhone: Locator;
  readonly primaryExtension: Locator;
  readonly primaryEmail: Locator;

  // Secondary contact fields
  readonly secondaryContactDropdown: Locator;
  readonly secondaryGivenName: Locator;
  readonly secondarySurname: Locator;
  readonly secondaryCompany: Locator;
  readonly secondaryPosition: Locator;
  readonly secondaryPhone: Locator;
  readonly secondaryExtension: Locator;
  readonly secondaryEmail: Locator;

  // Buttons
  readonly saveButton: Locator;
  readonly closeButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Primary contact fields
    // Note: Using .first() to get primary contact fields since there are two sets
    this.primaryContactDropdown = page
      .getByLabel(/Add New Contact or Select Existing User/i)
      .first();
    this.primaryGivenName = page.getByLabel(/Given Name/i).first();
    this.primarySurname = page.getByLabel(/Surname/i).first();
    this.primaryCompany = page.getByLabel(/Company Name/i).first();
    this.primaryPosition = page.getByLabel(/Position\/Role/i).first();
    this.primaryPhone = page.getByLabel(/Work Phone Number/i).first();
    this.primaryExtension = page.getByLabel(/Ext\./i).first();
    this.primaryEmail = page.getByLabel(/Work Email Address/i).first();

    // Secondary contact fields
    // Note: Using .last() to get secondary contact fields
    this.secondaryContactDropdown = page
      .getByLabel(/Add New Contact or Select Existing User/i)
      .last();
    this.secondaryGivenName = page.getByLabel(/Given Name/i).last();
    this.secondarySurname = page.getByLabel(/Surname/i).last();
    this.secondaryCompany = page.getByLabel(/Company Name/i).last();
    this.secondaryPosition = page.getByLabel(/Position\/Role/i).last();
    this.secondaryPhone = page.getByLabel(/Work Phone Number/i).last();
    this.secondaryExtension = page.getByLabel(/Ext\./i).last();
    this.secondaryEmail = page.getByLabel(/Work Email Address/i).last();

    // Buttons and messages
    this.saveButton = page.getByRole("button", { name: /^Save$/i });
    this.closeButton = page.getByRole("button", { name: /Close/i });
    this.successMessage = page.getByText(/Submission created successfully/i);
  }

  /**
   * Fill contact information form with new contact data
   *
   * @param data - Contact information data
   */
  async fillContactInformation(data: {
    primaryContact: {
      givenName: string;
      surname: string;
      company: string;
      position: string;
      phone: string;
      extension?: string;
      email: string;
    };
    secondaryContact?: {
      givenName: string;
      surname: string;
      company: string;
      position: string;
      phone: string;
      extension?: string;
      email: string;
    };
  }): Promise<void> {
    // Fill primary contact
    await this.primaryGivenName.fill(data.primaryContact.givenName);
    await this.primarySurname.fill(data.primaryContact.surname);
    await this.primaryCompany.fill(data.primaryContact.company);
    await this.primaryPosition.fill(data.primaryContact.position);
    await this.primaryPhone.fill(data.primaryContact.phone);
    if (data.primaryContact.extension) {
      await this.primaryExtension.fill(data.primaryContact.extension);
    }
    await this.primaryEmail.fill(data.primaryContact.email);

    // Fill secondary contact if provided
    if (data.secondaryContact) {
      await this.secondaryGivenName.fill(data.secondaryContact.givenName);
      await this.secondarySurname.fill(data.secondaryContact.surname);
      await this.secondaryCompany.fill(data.secondaryContact.company);
      await this.secondaryPosition.fill(data.secondaryContact.position);
      await this.secondaryPhone.fill(data.secondaryContact.phone);
      if (data.secondaryContact.extension) {
        await this.secondaryExtension.fill(data.secondaryContact.extension);
      }
      await this.secondaryEmail.fill(data.secondaryContact.email);
    }

    // Click Save
    await this.saveButton.click();
    await this.waitForReady();
  }

  /**
   * Select an existing user from dropdown (alternative to filling form)
   *
   * @param contactType - 'primary' or 'secondary'
   * @param userName - Name of user to select
   */
  async selectExistingUser(
    contactType: "primary" | "secondary",
    userName: string,
  ): Promise<void> {
    const dropdown =
      contactType === "primary"
        ? this.primaryContactDropdown
        : this.secondaryContactDropdown;

    // Click dropdown
    await dropdown.click();

    // Select option by text
    await this.page.getByRole("option", { name: userName }).click();

    await this.waitForReady();
  }

  /**
   * Verify contact information was saved successfully
   */
  async verifySaved(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify we're on the contact information page
   */
  async verifyOnContactInformationPage(): Promise<void> {
    // Check for presence of primary contact fields
    await expect(this.primaryGivenName).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }
}
