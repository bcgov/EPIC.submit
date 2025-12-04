import './commands';

// Handle uncaught exceptions during auth
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver') || err.message.includes('keycloak')) {
    return false;
  }
  return true;
});

// Custom login command using ROPC (Resource Owner Password Credentials) flow
Cypress.Commands.add('kcLogin', (username: string, password: string) => {
  const authority = 'https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic';
  const clientId = 'epic-submit';
  const tokenEndpoint = `${authority}/protocol/openid-connect/token`;

  cy.request({
    method: 'POST',
    url: tokenEndpoint,
    form: true,
    body: {
      grant_type: 'password',
      client_id: clientId,
      username: username,
      password: password,
      scope: 'openid profile email'
    }
  }).then((response) => {
    const { access_token, id_token, refresh_token } = response.body;

    // Store in sessionStorage matching oidc-client-ts format
    const storageKey = `oidc.user:${authority}:${clientId}`;
    const user = {
      access_token,
      id_token,
      refresh_token,
      token_type: 'Bearer',
      scope: 'openid profile email',
      profile: {
        sub: username,
      }
    };

    cy.window().then((win) => {
      win.sessionStorage.setItem(storageKey, JSON.stringify(user));
    });
  });
});

Cypress.Commands.add('kcLogout', () => {
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});
