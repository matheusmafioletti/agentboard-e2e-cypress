describe('Authentication — Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('logs in with valid credentials', () => {
    cy.findByLabelText(/email/i).type('alice@test.com');
    cy.findByLabelText(/senha|password/i).type('secret123');
    cy.findByRole('button', { name: /entrar|login/i }).click();
    cy.url().should('include', '/board');
  });

  it('shows error for invalid credentials', () => {
    cy.findByLabelText(/email/i).type('wrong@test.com');
    cy.findByLabelText(/senha|password/i).type('wrongpass');
    cy.findByRole('button', { name: /entrar|login/i }).click();
    cy.findByRole('alert').should('be.visible');
  });

  it('logs in via API for faster test setup', () => {
    cy.loginViaApi('alice@test.com', 'secret123');
    cy.visit('/board');
    cy.url().should('include', '/board');
  });
});
