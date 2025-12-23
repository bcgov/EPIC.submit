/**
 * Database Seeding Fixtures
 * Demonstrates Playwright fixture composition and auto-cleanup
 */

import { test as base, Page } from '@playwright/test';
import {
  seedProponentUser,
  seedProponentWithProject,
  cleanupTestData
} from '../helpers/seed';
import { kcLogin, kcLogout } from '../auth';
import type { ProponentUserOptions, ProponentWithProjectOptions } from '../types';

/**
 * Extended test context with database seeding
 */
type DbFixtures = {
  /**
   * Fixture: Seeded proponent user (no authentication)
   */
  seededProponent: {
    guid: string;
    options?: ProponentUserOptions;
  };

  /**
   * Fixture: Seeded proponent + authenticated session
   * Demonstrates fixture composition (combines seeding + auth)
   */
  authenticatedProponentSession: Page;

  /**
   * Fixture: Seeded proponent + project (no authentication)
   */
  seededProponentWithProject: {
    guid: string;
    proponentId: number;
    projectId: number;
    accountProjectId: number;
    options: ProponentWithProjectOptions;
  };

  /**
   * Fixture: Seeded proponent + project + authenticated session
   * The "batteries included" fixture - demonstrates advanced fixture composition
   */
  authenticatedProponentWithProject: {
    page: Page;
    guid: string;
    proponentId: number;
    projectId: number;
    accountProjectId: number;
  };
};

/**
 * Playwright test with database seeding fixtures
 */
export const test = base.extend<DbFixtures>({
  /**
   * Fixture: Seeded proponent user
   */
  seededProponent: async ({}, use) => {
    const guid = '71cb238c-147e-4d6b-85d1-de7f8659f049';
    const options: ProponentUserOptions = {
      proponentId: 8888,
      firstName: 'E2E',
      lastName: 'Proponent',
      position: 'Test Administrator',
      workEmail: 'e2e.proponent@test.example.com',
      workPhone: '250-555-0100',
      role: 'PROJECT_ADMIN',
    };

    console.log('\n🌱 [Fixture] Seeding proponent user...');
    seedProponentUser(guid, options);

    await use({ guid, options });

    console.log('\n🧹 [Fixture] Cleaning up proponent user...');
    cleanupTestData({ guid, proponentId: options.proponentId });
  },

  /**
   * Fixture: Authenticated proponent session
   * Demonstrates fixture composition: builds on seededProponent
   */
  authenticatedProponentSession: async ({ page, seededProponent }, use) => {
    console.log('\n🔐 [Fixture] Authenticating proponent...');

    await kcLogout(page);
    await kcLogin(
      page,
      process.env.PROPONENT_USERNAME!,
      process.env.PROPONENT_PASSWORD!
    );

    await use(page);

    console.log('\n👋 [Fixture] Logging out...');
    await kcLogout(page);
  },

  /**
   * Fixture: Seeded proponent with project
   * Seeds complete setup: User → Account → Project → AccountProject
   */
  seededProponentWithProject: async ({}, use) => {
    const guid = '71cb238c-147e-4d6b-85d1-de7f8659f049';
    const proponentId = 8888;
    const projectId = 9999;
    const accountProjectId = 7777;

    const options: ProponentWithProjectOptions = {
      proponentId,
      firstName: 'E2E',
      lastName: 'Proponent',
      position: 'Test Administrator',
      workEmail: 'e2e.proponent@test.example.com',
      workPhone: '250-555-0100',
      role: 'PROJECT_ADMIN',
      projectId,
      projectName: 'Coastal GasLink Pipeline',
      accountProjectId,
      eaCertificate: 'E2E-2024-01',
      epicGuid: 'e2e-test-project-guid',
    };

    console.log('\n🌱 [Fixture] Seeding proponent with project...');
    seedProponentWithProject(guid, options);

    await use({
      guid,
      proponentId,
      projectId,
      accountProjectId,
      options
    });

    console.log('\n🧹 [Fixture] Cleaning up proponent with project...');
    cleanupTestData({ guid, proponentId, projectId });
  },

  /**
   * Fixture: The Ultimate Fixture
   * Combines seeding + authentication for complete test setup
   * This demonstrates advanced fixture composition
   */
  authenticatedProponentWithProject: async (
    { page, seededProponentWithProject },
    use
  ) => {
    console.log('\n🔐 [Fixture] Authenticating proponent with project...');

    await kcLogout(page);
    await kcLogin(
      page,
      process.env.PROPONENT_USERNAME!,
      process.env.PROPONENT_PASSWORD!
    );

    // Navigate to project dashboard automatically
    console.log('\n🚀 [Fixture] Navigating to project dashboard...');
    await page.goto(
      `/proponent/projects/${seededProponentWithProject.accountProjectId}`
    );
    await page.waitForLoadState('networkidle');

    // Provide everything to test
    await use({
      page,
      guid: seededProponentWithProject.guid,
      proponentId: seededProponentWithProject.proponentId,
      projectId: seededProponentWithProject.projectId,
      accountProjectId: seededProponentWithProject.accountProjectId,
    });

    console.log('\n👋 [Fixture] Logging out...');
    await kcLogout(page);
  },
});

export { expect } from '@playwright/test';
