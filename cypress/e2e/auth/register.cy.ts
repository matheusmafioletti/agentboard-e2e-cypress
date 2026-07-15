import { testData } from '../../api/services/TestDataService';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Authentication — Register', () => {
  it('successful registration redirects to /inicio and shows workspace name in sidebar', { tags: '@local' }, () => {
    const email = generateEmail('register');
    const tenantName = generateTenantName();

    cy.visit('/register');
    cy.findByLabelText(/nome|name/i).type('Test User');
    cy.findByLabelText(/time\s*\/\s*empresa|workspace|tenant|organização/i).type(tenantName);
    cy.findByLabelText(/e-mail|email/i).type(email);
    cy.findByLabelText(/senha|password/i).type(PASSWORD);
    cy.findByRole('button', { name: /criar conta|registrar|register/i }).click();
    cy.findByRole('button', { name: /ir para o início/i }).click();
    cy.url().should('include', '/inicio');
  });

  it('duplicate email shows error and user stays on /register', { tags: '@local' }, () => {
    const email = generateEmail('dup');
    const tenantName = generateTenantName();

    testData.createAuthenticatedUser(email, PASSWORD, tenantName);

    cy.visit('/register');
    cy.findByLabelText(/nome|name/i).type('Another User');
    cy.findByLabelText(/time\s*\/\s*empresa|workspace|tenant|organização/i).type(generateTenantName());
    cy.findByLabelText(/e-mail|email/i).type(email);
    cy.findByLabelText(/senha|password/i).type(PASSWORD);
    cy.findByRole('button', { name: /criar conta|registrar|register/i }).click();

    cy.contains(/e-mail já cadastrado|falha no cadastro/i).should('be.visible');
    cy.url().should('include', '/register');
  });
});
