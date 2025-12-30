/**
 * Environment Configuration Types
 * Type definitions for test environment variables
 */

/**
 * Required environment variables for E2E tests
 */
export interface E2EEnvironment {
  // Application URLs
  BASE_URL: string;
  VITE_API_URL: string;

  // Authentication credentials
  STAFF_USERNAME: string;
  STAFF_PASSWORD: string;
  PROPONENT_USERNAME: string;
  PROPONENT_PASSWORD: string;
  PROPONENT_BCSC_USERNAME: string;
  PROPONENT_BCSC_PASSWORD: string;
  PROPONENT_BCEID_USERNAME: string;
  PROPONENT_BCEID_PASSWORD: string;

  // Keycloak admin (for E2E setup/teardown)
  KEYCLOAK_ADMIN_CLIENT?: string;
  KEYCLOAK_ADMIN_SECRET?: string;
}

/**
 * Partial environment for optional overrides
 */
export type PartialE2EEnvironment = Partial<E2EEnvironment>;
