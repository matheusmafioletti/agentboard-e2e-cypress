import { generateEmail, generateWorkspaceName } from '../../support/test-utils';

describe('Items List [TC-ITEMS-001..004]', () => {
  let userToken = '';
  let userTenantId = '';
  let projectId = '';
  let userEmail = '';
  let wsName = '';

  beforeEach(() => {
    userEmail = generateEmail('items');
    wsName = generateWorkspaceName();

    cy.registerViaApi(userEmail, 'Abc12345!', wsName).then((user) => {
      userToken = user.token;
      userTenantId = user.tenantId;

      cy.setAuth(user.token, {
        userId: user.userId,
        email: userEmail,
        tenantId: user.tenantId,
        tenantName: wsName,
        role: 'ADMIN',
      });

      cy.createProjectViaApi(user.token, user.tenantId, 'Items Test Project').then((proj) => {
        projectId = proj.id;
      });
    });
  });

  it('TC-ITEMS-001: /itens shows table with Tipo, Título, and Status columns', () => {
    cy.createWorkItemViaApi(userToken, userTenantId, projectId, 'Sample Task', 'TASK');

    cy.visit('/itens');
    cy.findByRole('columnheader', { name: /tipo|type/i }).should('be.visible');
    cy.findByRole('columnheader', { name: /título|title/i }).should('be.visible');
    cy.findByRole('columnheader', { name: /status/i }).should('be.visible');
  });

  it('TC-ITEMS-002: type filter shows only matching items; clearing filter restores all', () => {
    cy.createWorkItemViaApi(userToken, userTenantId, projectId, 'Feature Item', 'FEATURE');
    cy.createWorkItemViaApi(userToken, userTenantId, projectId, 'Task Item', 'TASK');

    cy.visit('/itens');

    cy.findByRole('combobox', { name: /tipo|filter|type/i }).select('TASK');
    cy.findByText('Task Item').should('be.visible');
    cy.findByText('Feature Item').should('not.exist');

    cy.findByRole('combobox', { name: /tipo|filter|type/i }).select('FEATURE');
    cy.findByText('Feature Item').should('be.visible');
    cy.findByText('Task Item').should('not.exist');

    cy.findByRole('combobox', { name: /tipo|filter|type/i }).select('');
    cy.findByText('Feature Item').should('be.visible');
    cy.findByText('Task Item').should('be.visible');
  });

  it('TC-ITEMS-003: clicking an item opens its detail view with the correct ID', () => {
    cy.createWorkItemViaApi(userToken, userTenantId, projectId, 'Detail Item', 'TASK').then(
      (item) => {
        cy.visit('/itens');
        cy.findByText('Detail Item').click();
        cy.url().should('include', item.id);
        cy.findByText('Detail Item').should('be.visible');
      },
    );
  });

  it('TC-ITEMS-004: tree view expands Feature to show US children, then US to show Tasks', () => {
    cy.createWorkItemViaApi(userToken, userTenantId, projectId, 'Root Feature', 'FEATURE').then(
      (feature) => {
        cy.createWorkItemViaApi(
          userToken,
          userTenantId,
          projectId,
          'Child Story',
          'USER_STORY',
          feature.id,
        ).then((story) => {
          cy.createWorkItemViaApi(
            userToken,
            userTenantId,
            projectId,
            'Nested Task',
            'TASK',
            story.id,
          );

          cy.visit('/itens');

          cy.findByRole('button', { name: /árvore|tree view/i }).click();

          cy.findByText('Root Feature')
            .closest('[data-testid^="tree-row-"]')
            .findByRole('button', { name: /expandir|expand/i })
            .click();

          cy.findByText('Child Story').should('be.visible');

          cy.findByText('Child Story')
            .closest('[data-testid^="tree-row-"]')
            .findByRole('button', { name: /expandir|expand/i })
            .click();

          cy.findByText('Nested Task').should('be.visible');
        });
      },
    );
  });
});
