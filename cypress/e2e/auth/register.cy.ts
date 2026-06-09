import { generateEmail, generateWorkspaceName } from '../../support/test-utils';

describe('Authentication — Register [TC-AUTH-001..002]', () => {
  it('TC-AUTH-001: successful registration redirects to /inicio and shows workspace name in sidebar', () => {
    const email = generateEmail('register');
    const wsName = generateWorkspaceName();

    cy.visit('/register');
    cy.findByLabelText(/nome|name/i).type('Test User');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/senha|password/i).type('Abc12345!');
    cy.findByLabelText(/workspace|tenant|organização/i).type(wsName);
    cy.findByRole('button', { name: /registrar|register|criar conta/i }).click();

    cy.url().should('include', '/inicio');
    cy.findByText(wsName).should('be.visible');
  });

  it('TC-AUTH-002: duplicate email shows error and user stays on /register', () => {
    const email = generateEmail('dup');
    const wsName = generateWorkspaceName();

    cy.registerViaApi(email, 'Abc12345!', wsName);

    cy.visit('/register');
    cy.findByLabelText(/nome|name/i).type('Another User');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/senha|password/i).type('Abc12345!');
    cy.findByLabelText(/workspace|tenant|organização/i).type(generateWorkspaceName());
    cy.findByRole('button', { name: /registrar|register|criar conta/i }).click();

    cy.findByRole('alert').should('be.visible');
    cy.url().should('include', '/register');
  });
});
