/**
 * E2E Test Data Seeding Helpers
 *
 * These TypeScript helpers call standalone Python scripts that seed test data.
 * All seeding logic is written in Python to match the API language and use SQLAlchemy models.
 */

import { execSync } from 'child_process';

/**
 * Detect if running in Docker environment
 */
function isDockerEnvironment(): boolean {
  return process.env.USE_DOCKER === 'true' || process.env.CI === 'true';
}

/**
 * Execute Python seeding script in the appropriate environment
 */
function execPythonScript(scriptPath: string): void {
  if (isDockerEnvironment()) {
    // Running in Docker (CI or docker-compose setup)
    execSync(
      `docker exec $(docker compose -f docker-compose.e2e.yml ps -q api) ` +
      `python /opt/app-root/src/${scriptPath}`,
      { stdio: 'inherit' }
    );
  } else {
    // Running locally without Docker
    execSync(
      `cd submit-api && python ${scriptPath}`,
      { stdio: 'inherit' }
    );
  }
}

/**
 * Seed a proponent user with account and role.
 * Uses the default test GUID: 71cb238c-147e-4d6b-85d1-de7f8659f049
 *
 * @param guid - The auth_guid for the user (defaults to standard test GUID)
 */
export async function seedProponentUser(
  guid: string = '71cb238c-147e-4d6b-85d1-de7f8659f049'
): Promise<void> {
  try {
    console.log(`Seeding proponent user: ${guid}`);
    execPythonScript('scripts/seed_default_proponent.py');
    console.log(`✓ Proponent user seeded`);
  } catch (error) {
    console.error(`Failed to seed proponent user`, error);
    throw error;
  }
}

/**
 * Clean up test data for the default test user.
 * Removes the default test GUID: 71cb238c-147e-4d6b-85d1-de7f8659f049
 *
 * @param options - Optional (currently unused, kept for API compatibility)
 */
export async function cleanupTestData(options: {
  guid?: string;
} = {}): Promise<void> {
  try {
    console.log('Cleaning up test data...');
    execPythonScript('scripts/cleanup_default_proponent.py');
    console.log('✓ Test data cleaned up');
  } catch (error) {
    console.error('Failed to cleanup test data', error);
    throw error;
  }
}

/**
 * Seed the default E2E test proponent user.
 * Uses the standard test GUID: 71cb238c-147e-4d6b-85d1-de7f8659f049
 */
export async function seedDefaultProponentUser(): Promise<void> {
  await seedProponentUser();
}
