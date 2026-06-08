describe('Authentication — Register', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('registers a new user with valid data', () => {
    const timestamp = Date.now();
    cy.findByLabelText(/nome|name/i).type(`User ${timestamp}`);
    cy.findByLabelText(/email/i).type(`user${timestamp}@test.com`);
    cy.findByLabelText(/senha|password/i).type('secret123');
    cy.findByRole('button', { name: /registrar|register|criar conta/i }).click();
    cy.url().should('include', '/board');
  });

  it('shows validation error for missing fields', () => {
    cy.findByRole('button', { name: /registrar|register|criar conta/i }).click();
    cy.findByRole('alert').should('be.visible');
  });

  it('shows error for duplicate email', () => {
    cy.findByLabelText(/nome|name/i).type('Alice');
    cy.findByLabelText(/email/i).type('alice@test.com');
    cy.findByLabelText(/senha|password/i).type('secret123');
    cy.findByRole('button', { name: /registrar|register|criar conta/i }).click();
    cy.findByRole('alert').should('be.visible');
  });

  it('navigates to login from register page', () => {
    cy.findByRole('link', { name: /entrar|login|já tenho conta/i }).click();
    cy.url().should('include', '/login');
  });
});
