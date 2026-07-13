import { testData } from '../../api/services/TestDataService';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Authentication — Register', () => {
  it('successful registration redirects to /inicio and shows workspace name in sidebar', { tags: '@local' }, () => {
    const email = generateEmail('register');
    const tenantName = generateTenantName();

    cy.visit('/register');
    cy.findByLabelText(/nome|name/i).type('Test User');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/senha|password/i).type(PASSWORD);
    cy.findByLabelText(/workspace|tenant|organização/i).type(tenantName);
    cy.findByRole('button', { name: /registrar|register|criar conta/i }).click();

    cy.url().should('include', '/inicio');
    cy.findByText(tenantName).should('be.visible');
  });

  it('duplicate email shows error and user stays on /register', { tags: '@local' }, () => {
    const email = generateEmail('dup');
    const tenantName = generateTenantName();

    testData.createAuthenticatedUser(email, PASSWORD, tenantName);

    cy.visit('/register');
    cy.findByLabelText(/nome|name/i).type('Another User');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/senha|password/i).type(PASSWORD);
    cy.findByLabelText(/workspace|tenant|organização/i).type(generateTenantName());
    cy.findByRole('button', { name: /registrar|register|criar conta/i }).click();

    cy.findByRole('alert').should('be.visible');
    cy.url().should('include', '/register');
  });
});
