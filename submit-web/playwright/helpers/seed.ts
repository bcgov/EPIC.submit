/**
 * E2E Test Data Seeding Helpers
 *
 * These helpers call Python seeding scripts inside the API container via docker compose exec.
 * Each test can seed its own data using beforeEach hooks for maximum test isolation.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the path to docker-compose.e2e.yml from the helpers directory
 */
function getDockerComposePath(): string {
  // From submit-web/playwright/helpers/ -> ../../docker-compose.e2e.yml
  return path.join(__dirname, '..', '..', '..', 'docker-compose.e2e.yml');
}

/**
 * Execute a Python seeding script inside the API container
 */
function execPythonInContainer(command: string): void {
  const composePath = getDockerComposePath();

  try {
    execSync(
      `docker compose -f "${composePath}" exec -T api ${command}`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.error('Failed to execute command in container:', command);
    throw error;
  }
}

/**
 * Seed a proponent user for E2E testing
 *
 * @param guid - Keycloak user GUID
 * @param options - Optional user details
 */
export function seedProponentUser(
  guid: string,
  options: {
    proponentId?: number;
    firstName?: string;
    lastName?: string;
    position?: string;
    workEmail?: string;
    workPhone?: string;
    extension?: string;
    role?: string;
  } = {}
): void {
  const args = [
    `--guid ${guid}`,
    options.proponentId ? `--proponent-id ${options.proponentId}` : '',
    options.firstName ? `--first-name "${options.firstName}"` : '',
    options.lastName ? `--last-name "${options.lastName}"` : '',
    options.position ? `--position "${options.position}"` : '',
    options.workEmail ? `--work-email "${options.workEmail}"` : '',
    options.workPhone ? `--work-phone "${options.workPhone}"` : '',
    options.extension ? `--extension "${options.extension}"` : '',
    options.role ? `--role ${options.role}` : '',
  ].filter(Boolean).join(' ');

  console.log(`Seeding proponent user: ${guid}`);
  execPythonInContainer(`python scripts/seed_e2e_data.py ${args}`);
  console.log(`✓ Proponent user seeded`);
}

/**
 * Cleanup test data
 *
 * @param options - User GUID or Proponent ID to delete
 */
export function cleanupTestData(options: {
  guid?: string;
  proponentId?: number;
}): void {
  const args = [
    '--cleanup',
    options.guid ? `--guid ${options.guid}` : '',
    options.proponentId ? `--proponent-id ${options.proponentId}` : '',
  ].filter(Boolean).join(' ');

  console.log('Cleaning up test data...');
  execPythonInContainer(`python scripts/seed_e2e_data.py ${args}`);
  console.log('✓ Test data cleaned up');
}
