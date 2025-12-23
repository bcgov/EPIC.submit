/**
 * Environment Configuration Helper
 * Utilities for accessing and validating test environment variables
 */

import type { E2EEnvironment, PartialE2EEnvironment } from '../types';

/**
 * Get required environment variable
 * Throws error if not defined
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Required environment variable ${key} is not defined. Check .env.playwright file.`
    );
  }
  return value;
}

/**
 * Get optional environment variable with default value
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get all E2E environment variables
 * Validates that required variables are present
 */
export function getE2EEnvironment(): E2EEnvironment {
  return {
    // Application URLs
    BASE_URL: getOptionalEnv('BASE_URL', 'http://localhost:5173'),
    VITE_API_URL: getOptionalEnv('VITE_API_URL', 'http://localhost:3200/api'),

    // Staff credentials
    STAFF_USERNAME: getRequiredEnv('STAFF_USERNAME'),
    STAFF_PASSWORD: getRequiredEnv('STAFF_PASSWORD'),

    // Proponent credentials (ROPC)
    PROPONENT_USERNAME: getRequiredEnv('PROPONENT_USERNAME'),
    PROPONENT_PASSWORD: getRequiredEnv('PROPONENT_PASSWORD'),

    // BCSC credentials
    PROPONENT_BCSC_USERNAME: getRequiredEnv('PROPONENT_BCSC_USERNAME'),
    PROPONENT_BCSC_PASSWORD: getRequiredEnv('PROPONENT_BCSC_PASSWORD'),

    // BCeID credentials
    PROPONENT_BCEID_USERNAME: getRequiredEnv('PROPONENT_BCEID_USERNAME'),
    PROPONENT_BCEID_PASSWORD: getRequiredEnv('PROPONENT_BCEID_PASSWORD'),

    // Keycloak admin (optional)
    KEYCLOAK_ADMIN_CLIENT: process.env.KEYCLOAK_ADMIN_CLIENT,
    KEYCLOAK_ADMIN_SECRET: process.env.KEYCLOAK_ADMIN_SECRET,
  };
}

/**
 * Validate that all required environment variables are present
 * Useful for global setup hooks
 */
export function validateEnvironment(): void {
  const requiredVars = [
    'STAFF_USERNAME',
    'STAFF_PASSWORD',
    'PROPONENT_USERNAME',
    'PROPONENT_PASSWORD',
    'PROPONENT_BCSC_USERNAME',
    'PROPONENT_BCSC_PASSWORD',
    'PROPONENT_BCEID_USERNAME',
    'PROPONENT_BCEID_PASSWORD',
  ];

  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Check that .env.playwright file exists and contains all required variables.'
    );
  }
}

/**
 * Get credentials for a specific user type
 */
export function getCredentials(userType: 'staff' | 'proponent' | 'bcsc' | 'bceid'): {
  username: string;
  password: string;
} {
  switch (userType) {
    case 'staff':
      return {
        username: getRequiredEnv('STAFF_USERNAME'),
        password: getRequiredEnv('STAFF_PASSWORD'),
      };
    case 'proponent':
      return {
        username: getRequiredEnv('PROPONENT_USERNAME'),
        password: getRequiredEnv('PROPONENT_PASSWORD'),
      };
    case 'bcsc':
      return {
        username: getRequiredEnv('PROPONENT_BCSC_USERNAME'),
        password: getRequiredEnv('PROPONENT_BCSC_PASSWORD'),
      };
    case 'bceid':
      return {
        username: getRequiredEnv('PROPONENT_BCEID_USERNAME'),
        password: getRequiredEnv('PROPONENT_BCEID_PASSWORD'),
      };
    default:
      throw new Error(`Unknown user type: ${userType}`);
  }
}
