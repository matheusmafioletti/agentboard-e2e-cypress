import { testData } from '../../api/services/TestDataService';
import { stagingCredentials } from '../../support/environment';
import { setAuthInLocalStorage } from '../../support/browser';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Authentication — Login', () => {
  it('single-tenant login redirects directly to /inicio', { tags: '@local' }, () => {
    const email = generateEmail('login-single');
    testData.createAuthenticatedUser(email, PASSWORD, generateTenantName());
    cy.visit('/login');
    cy.findByLabelText(/e-mail|email/i).type(email);
    cy.findByLabelText(/senha|password/i).type(PASSWORD);
    cy.findByRole('button', { name: /entrar|login/i }).click();
    cy.url().should('include', '/inicio');
  });

  it('multi-tenant login shows TenantPicker before redirecting', { tags: '@local' }, () => {
    const email = generateEmail('login-multi');
    const tenantName = generateTenantName();
    const tenantName2 = generateTenantName();

    testData.createAuthenticatedUser(email, PASSWORD, tenantName).then((user) => {
      testData.createSecondTenant(user.jwt, tenantName2);
    });

    cy.visit('/login');
    cy.findByLabelText(/e-mail|email/i).type(email);
    cy.findByLabelText(/senha|password/i).type(PASSWORD);
    cy.findByRole('button', { name: /entrar|login/i }).click();

    cy.findByText(tenantName).should('be.visible').click();
    cy.findByRole('button', { name: /continuar/i }).click();
    cy.url().should('include', '/inicio');
  });

  it('seed user login redirects directly to /inicio', { tags: '@staging' }, () => {
    const { email, password } = stagingCredentials();
    cy.visit('/login');
    cy.findByLabelText(/e-mail|email/i).type(email);
    cy.findByLabelText(/senha|password/i).type(password);
    cy.findByRole('button', { name: /entrar|login/i }).click();
    cy.url().should('include', '/inicio');
  });

  it('invalid credentials show generic error message', { tags: '@wip' }, () => {
    cy.visit('/login');
    cy.findByLabelText(/e-mail|email/i).type('naoexiste@agentboard.test');
    cy.findByLabelText(/senha|password/i).type('WrongPass999!');
    cy.findByRole('button', { name: /entrar|login/i }).click();
    cy.contains(/e-mail ou senha inválidos/i).should('be.visible');
    cy.url().should('include', '/login');
  });

  it('unauthenticated access to /board redirects to /login', { tags: '@staging' }, () => {
    cy.visit('/board');
    cy.url().should('include', '/login');
  });

  it('logout redirects to /login and blocks subsequent /inicio access', { tags: '@local' }, () => {
    const email = generateEmail('logout');
    const tenantName = generateTenantName();

    testData.createAuthenticatedUser(email, PASSWORD, tenantName).then((user) => {
      setAuthInLocalStorage(user.jwt, {
        userId: user.userId,
        email,
        tenantId: user.tenantId,
        tenantName,
        role: 'ADMIN',
      });
    });

    cy.visit('/inicio');
    cy.url().should('include', '/inicio');

    cy.findByRole('button', { name: /^perfil$/i }).click();
    cy.findByRole('button', { name: /^sair$/i }).click();
    cy.url().should('include', '/login');

    cy.visit('/inicio');
    cy.url().should('include', '/login');
  });
});
