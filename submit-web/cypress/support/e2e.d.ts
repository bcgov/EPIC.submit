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

    /**
     * Login via BC Services Card (BCSC) test login flow
     * @param username - BCSC test username
     * @param password - BCSC test password
     */
    loginViaBCSC(username: string, password: string): Chainable<void>;

    /**
     * Login via BCeID (Business BCeID)
     * @param username - BCeID username
     * @param password - BCeID password
     */
    loginViaBCeID(username: string, password: string): Chainable<void>;
  }
}
