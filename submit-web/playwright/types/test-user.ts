/**
 * Test User Types
 * Type definitions for test users and seeding operations
 */

/**
 * User credentials for authentication
 */
export interface TestCredentials {
  username: string;
  password: string;
}

/**
 * Proponent user seeding options
 * Maps to Python seed_e2e_data.py script arguments
 */
export interface ProponentUserOptions {
  proponentId?: number;
  firstName?: string;
  lastName?: string;
  position?: string;
  workEmail?: string;
  workPhone?: string;
  extension?: string;
  role?: string;
}

/**
 * Test data cleanup options
 */
export interface CleanupOptions {
  guid?: string;
  proponentId?: number;
  projectId?: number;
}

/**
 * Project seeding options
 * Maps to Python seed_e2e_data.py --with-project arguments
 */
export interface ProjectSeedOptions {
  projectId?: number;
  projectName?: string;
  accountProjectId?: number;
  eaCertificate?: string;
  epicGuid?: string;
}

/**
 * Combined proponent + project seeding options
 */
export interface ProponentWithProjectOptions extends ProponentUserOptions {
  accountId?: number;
  projectId?: number;
  projectName?: string;
  accountProjectId?: number;
  eaCertificate?: string;
  epicGuid?: string;
}

/**
 * User role types
 */
export type UserRole = 'PROJECT_ADMIN' | 'SUBMISSION_ADMIN' | 'PROPONENT_VIEWER';

/**
 * User type discriminator
 */
export type UserType = 'staff' | 'proponent';
