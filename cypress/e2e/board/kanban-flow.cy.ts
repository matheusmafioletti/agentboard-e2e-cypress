describe('Kanban Board Flow', () => {
  beforeEach(() => {
    cy.login('alice@test.com', 'secret123');
    cy.visit('/board');
  });

  it('creates a new work item', () => {
    cy.findByRole('button', { name: /nova tarefa|create/i }).click();
    cy.findByLabelText(/título|title/i).type('Implement authentication');
    cy.findByRole('button', { name: /criar|create/i }).click();
    cy.findByText('Implement authentication').should('be.visible');
  });

  it('displays work items grouped by status', () => {
    cy.findByRole('region', { name: /todo/i }).should('be.visible');
    cy.findByRole('region', { name: /in progress/i }).should('be.visible');
    cy.findByRole('region', { name: /done/i }).should('be.visible');
  });

  it('opens work item detail on card click', () => {
    cy.findByText('Implement authentication').click();
    cy.findByRole('dialog').should('be.visible');
  });

  it('shows empty board message when no items exist', () => {
    cy.findByRole('region', { name: /todo/i })
      .findByText(/nenhuma tarefa|no items/i)
      .should('be.visible');
  });
});
