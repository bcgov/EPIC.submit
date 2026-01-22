import { Page } from '@playwright/test';

/**
 * Base Page Object
 * Common patterns for all page objects
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for page to be ready
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
