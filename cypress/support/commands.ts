import '@testing-library/cypress/add-commands';

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createWorkItem(title: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/senha|password/i).type(password);
    cy.findByRole('button', { name: /entrar|login/i }).click();
    cy.url().should('include', '/inicio');
  });
});

Cypress.Commands.add('createWorkItem', (title: string) => {
  cy.findByRole('button', { name: /nova tarefa|create/i }).click();
  cy.findByLabelText(/título|title/i).type(title);
  cy.findByRole('button', { name: /criar|create/i }).click();
  cy.findByText(title).should('be.visible');
});
