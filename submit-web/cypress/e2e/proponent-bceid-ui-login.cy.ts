describe.skip('Proponent User Login via BCeID (UI Flow)', () => {
  beforeEach(() => {
    cy.kcLogout();
  });

  it('should login via BCeID UI and access proponent dashboard', () => {
    const username = Cypress.env('PROPONENT_BCEID_USERNAME');
    const password = Cypress.env('PROPONENT_BCEID_PASSWORD');

    cy.loginViaBCeID(username, password);

    // Verify landed on proponent dashboard
    cy.contains('Projects', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/proponent');

    // Verify user greeting appears
    cy.get('#menu-appbar').should('contain', 'Hi,');
  });
});
