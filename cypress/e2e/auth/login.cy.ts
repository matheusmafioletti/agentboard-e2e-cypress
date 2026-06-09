import { generateEmail, generateWorkspaceName } from '../../support/test-utils';

describe('Authentication — Login [TC-AUTH-003..007]', () => {
  it('TC-AUTH-003: single-tenant login redirects directly to /inicio', () => {
    const email = generateEmail('login-single');
    cy.registerViaApi(email, 'Abc12345!', generateWorkspaceName());
    cy.visit('/login');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/senha|password/i).type('Abc12345!');
    cy.findByRole('button', { name: /entrar|login/i }).click();
    cy.url().should('include', '/inicio');
  });

  it('TC-AUTH-004: multi-tenant login shows TenantPicker before redirecting', () => {
    const email = generateEmail('login-multi');
    const wsName = generateWorkspaceName();
    const wsName2 = generateWorkspaceName();

    cy.registerViaApi(email, 'Abc12345!', wsName).then((user) => {
      cy.createTenantViaApi(user.token, wsName2);
    });

    cy.visit('/login');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/senha|password/i).type('Abc12345!');
    cy.findByRole('button', { name: /entrar|login/i }).click();

    cy.findByText(wsName).should('be.visible').click();
    cy.url().should('include', '/inicio');
  });

  it('TC-AUTH-005: invalid credentials show generic error message', () => {
    cy.visit('/login');
    cy.findByLabelText(/email/i).type('naoexiste@agentboard.test');
    cy.findByLabelText(/senha|password/i).type('WrongPass999!');
    cy.findByRole('button', { name: /entrar|login/i }).click();
    cy.findByRole('alert').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('TC-AUTH-006: unauthenticated access to /board redirects to /login', () => {
    cy.visit('/board');
    cy.url().should('include', '/login');
  });

  it('TC-AUTH-007: logout redirects to /login and blocks subsequent /inicio access', () => {
    const email = generateEmail('logout');
    const wsName = generateWorkspaceName();

    cy.registerViaApi(email, 'Abc12345!', wsName).then((user) => {
      cy.setAuth(user.token, {
        userId: user.userId,
        email,
        tenantId: user.tenantId,
        tenantName: wsName,
        role: 'ADMIN',
      });
    });

    cy.visit('/inicio');
    cy.url().should('include', '/inicio');

    cy.findByRole('button', { name: /sair|logout/i }).click();
    cy.url().should('include', '/login');

    cy.visit('/inicio');
    cy.url().should('include', '/login');
  });
});
