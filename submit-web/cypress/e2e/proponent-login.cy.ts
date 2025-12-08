describe("Proponent User Login", () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it("should login as proponent and access dashboard", () => {
    const username = Cypress.env("PROPONENT_USERNAME");
    const password = Cypress.env("PROPONENT_PASSWORD");

    cy.kcLogin(username, password);
    cy.visit("/");

    cy.contains("Projects", { timeout: 15000 }).should("be.visible");
    cy.url().should("match", /\/(proponent|projects)/);
  });
});
