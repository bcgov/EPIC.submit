describe.skip("Staff User Login", () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it("should login as staff and access dashboard", () => {
    const username = Cypress.env("STAFF_USERNAME");
    const password = Cypress.env("STAFF_PASSWORD");

    cy.kcLogin(username, password);
    cy.visit("/");

    // Basic assertions - adjust selectors based on actual app
    cy.contains("Projects", { timeout: 15000 }).should("be.visible");
    cy.url().should("match", /\/(staff|projects)/);
  });
});
