/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Login to Keycloak using Resource Owner Password Credentials flow
     * @param username - Keycloak username
     * @param password - Keycloak password
     */
    kcLogin(username: string, password: string): Chainable<void>;

    /**
     * Logout from Keycloak and clear session storage
     */
    kcLogout(): Chainable<void>;
  }
}
