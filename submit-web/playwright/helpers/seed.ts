/**
 * E2E Test Data Seeding Helpers
 *
 * These helpers call Python seeding scripts inside the API container via docker compose exec.
 * Each test can seed its own data using beforeEach hooks for maximum test isolation.
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the path to docker-compose.e2e.yml from the helpers directory
 */
function getDockerComposePath(): string {
  // From submit-web/playwright/helpers/ -> ../../docker-compose.e2e.yml
  return path.join(__dirname, "..", "..", "..", "docker-compose.e2e.yml");
}

/**
 * Execute a Python seeding script inside the API container
 */
function execPythonInContainer(command: string): void {
  const composePath = getDockerComposePath();

  try {
    execSync(`docker compose -f "${composePath}" exec -T api ${command}`, {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Failed to execute command in container:", command);
    throw error;
  }
}

/**
 * Seed an account for a proponent organization
 *
 * @param proponentId - Proponent ID
 * @param options - Optional account details
 */
export function seedAccount(
  proponentId: number = 8888,
  options: {
    accountId?: number;
  } = {},
): void {
  const args = [
    "--account-only",
    `--proponent-id ${proponentId}`,
    options.accountId ? `--account-id ${options.accountId}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  console.log(`Seeding account for proponent ID: ${proponentId}`);
  execPythonInContainer(`python scripts/seed_e2e_data.py ${args}`);
  console.log(`✓ Account seeded`);
}

/**
 * Seed a proponent user for E2E testing
 *
 * @param guid - Keycloak user GUID
 * @param accountId - Account ID to add user to (REQUIRED)
 * @param options - Optional user details
 */
export function seedProponentUser(
  guid: string,
  accountId: number,
  options: {
    firstName?: string;
    lastName?: string;
    position?: string;
    workEmail?: string;
    workPhone?: string;
    extension?: string;
    role?: string;
  } = {},
): void {
  const args = [
    `--guid ${guid}`,
    `--account-id-for-user ${accountId}`,
    options.firstName ? `--first-name "${options.firstName}"` : "",
    options.lastName ? `--last-name "${options.lastName}"` : "",
    options.position ? `--position "${options.position}"` : "",
    options.workEmail ? `--work-email "${options.workEmail}"` : "",
    options.workPhone ? `--work-phone "${options.workPhone}"` : "",
    options.extension ? `--extension "${options.extension}"` : "",
    options.role ? `--role ${options.role}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  console.log(`Seeding proponent user: ${guid}`);
  execPythonInContainer(`python scripts/seed_e2e_data.py ${args}`);
  console.log(`✓ Proponent user seeded`);
}

/**
 * Seed a complete proponent + project setup
 *
 * @param guid - Keycloak user GUID
 * @param options - Combined user and project options
 */
export function seedProponentWithProject(
  guid: string,
  options: {
    proponentId?: number;
    accountId?: number;
    firstName?: string;
    lastName?: string;
    position?: string;
    workEmail?: string;
    workPhone?: string;
    extension?: string;
    role?: string;
    projectId?: number;
    projectName?: string;
    accountProjectId?: number;
    eaCertificate?: string;
    epicGuid?: string;
  } = {},
): void {
  const args = [
    `--guid ${guid}`,
    "--with-project",
    options.proponentId ? `--proponent-id ${options.proponentId}` : "",
    options.accountId ? `--account-id ${options.accountId}` : "",
    options.firstName ? `--first-name "${options.firstName}"` : "",
    options.lastName ? `--last-name "${options.lastName}"` : "",
    options.position ? `--position "${options.position}"` : "",
    options.workEmail ? `--work-email "${options.workEmail}"` : "",
    options.workPhone ? `--work-phone "${options.workPhone}"` : "",
    options.extension ? `--extension "${options.extension}"` : "",
    options.role ? `--role ${options.role}` : "",
    options.projectId ? `--project-id ${options.projectId}` : "",
    options.projectName ? `--project-name "${options.projectName}"` : "",
    options.accountProjectId
      ? `--account-project-id ${options.accountProjectId}`
      : "",
    options.eaCertificate ? `--ea-certificate "${options.eaCertificate}"` : "",
    options.epicGuid ? `--epic-guid "${options.epicGuid}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  console.log(
    `Seeding complete proponent setup with project for GUID: ${guid}`,
  );
  execPythonInContainer(`python scripts/seed_e2e_data.py ${args}`);
  console.log(`✓ Proponent with project seeded`);
}

/**
 * Seed a package with items ready to fill
 *
 * @param accountProjectId - AccountProject ID (required)
 * @param options - Package configuration options
 */
export function seedPackageWithItems(
  accountProjectId: number,
  options: {
    packageId?: number;
    packageType?: "Management Plan" | "IEM";
    packageName?: string;
  } = {},
): void {
  const args = [
    `--account-project-id ${accountProjectId}`,
    "--with-package-items",
    options.packageId ? `--package-id ${options.packageId}` : "",
    options.packageType ? `--package-type "${options.packageType}"` : "",
    options.packageName ? `--package-name "${options.packageName}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  console.log(`Seeding package with items for account project: ${accountProjectId}`);
  execPythonInContainer(`python scripts/seed_e2e_data.py ${args}`);
  console.log(`✓ Package with items seeded`);
}

/**
 * Cleanup test data (enhanced)
 *
 * @param options - User GUID, Proponent ID, or Project ID to delete
 */
export function cleanupTestData(options: {
  guid?: string;
  proponentId?: number;
  projectId?: number;
}): void {
  const args = [
    "--cleanup",
    options.guid ? `--guid ${options.guid}` : "",
    options.proponentId ? `--proponent-id ${options.proponentId}` : "",
    options.projectId ? `--project-id ${options.projectId}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  console.log("Cleaning up test data...");
  execPythonInContainer(`python scripts/seed_e2e_data.py ${args}`);
  console.log("✓ Test data cleaned up");
}
