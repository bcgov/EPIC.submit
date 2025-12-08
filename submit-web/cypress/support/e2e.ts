/// <reference types="cypress" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./e2e.d.ts" />

import "./commands";

// Handle uncaught exceptions during auth
Cypress.on("uncaught:exception", (err) => {
  if (
    err.message.includes("ResizeObserver") ||
    err.message.includes("keycloak") ||
    err.message.includes("Unexpected")
  ) {
    return false;
  }
  return true;
});

// Custom login command using ROPC (Resource Owner Password Credentials) flow
Cypress.Commands.add("kcLogin", (username: string, password: string) => {
  const authority = "https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic";
  const clientId = "epic-submit";
  const tokenEndpoint = `${authority}/protocol/openid-connect/token`;

  cy.request({
    method: "POST",
    url: tokenEndpoint,
    form: true,
    body: {
      grant_type: "password",
      client_id: clientId,
      username: username,
      password: password,
      scope: "openid profile email",
    },
  }).then((response) => {
    const { access_token, id_token, refresh_token } = response.body;

    // Store in sessionStorage matching oidc-client-ts format
    const storageKey = `oidc.user:${authority}:${clientId}`;
    const user = {
      access_token,
      id_token,
      refresh_token,
      token_type: "Bearer",
      scope: "openid profile email",
      profile: {
        sub: username,
      },
    };

    cy.window().then((win) => {
      win.sessionStorage.setItem(storageKey, JSON.stringify(user));
    });
  });
});

Cypress.Commands.add("kcLogout", () => {
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

/**
 * Login via BCSC (BC Services Card) with full UI interaction
 * Handles the multi-step BCSC test login flow
 */
Cypress.Commands.add("loginViaBCSC", (username: string, password: string) => {
  Cypress.log({ name: "Login via BCSC" });

  // Step 1: Visit app and click Login button
  cy.visit("/");
  cy.get("button").contains("Login").click();

  cy.get("#bcsc-login").click();

  cy.get("#tile_test_with_username_password_device_div_id").click();

  cy.get("#username").type(username);
  cy.get("#password").type(password, { log: false });
  cy.get("#submit-btn").click();

  cy.contains("I agree").click();
  cy.contains("Continue").click();

  cy.url().should("include", "/oidc-callback", { timeout: 15000 });

  cy.url().should("match", /\/(staff|proponent)/, { timeout: 20000 });
});

/**
 * Login via BCeID (Business BCeID) with full UI interaction
 */
Cypress.Commands.add("loginViaBCeID", (username: string, password: string) => {
  Cypress.log({ name: "Login via BCeID" });

  // Step 1: Visit app and click Login button
  cy.visit("/");
  cy.get("button").contains("Login").click();

  // Step 2: Select BCeID from dropdown
  cy.get("#bceid-login").click();

  // Step 3: Handle BCeID login page (cross-origin)
  cy.origin(
    "https://dev.loginproxy.gov.bc.ca",
    { args: { username, password } },
    ({ username, password }) => {
      cy.get('[name="user"]').type(username);
      cy.get('[name="password"]').type(password, { log: false });
      cy.get('[name="btnSubmit"]').click();
    },
  );

  // Step 4: Wait for OAuth callback and routing
  cy.url().should("include", "/oidc-callback", { timeout: 15000 });
  cy.url().should("match", /\/(staff|proponent)/, { timeout: 20000 });
});
