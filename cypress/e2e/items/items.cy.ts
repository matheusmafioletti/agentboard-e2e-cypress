import { testData } from '../../api/services/TestDataService';
import { setAuthInLocalStorage } from '../../support/browser';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Items List', () => {
  let userJwt = '';
  let userTenantId = '';
  let projectId = '';
  let userEmail = '';
  let tenantName = '';

  beforeEach(() => {
    userEmail = generateEmail('items');
    tenantName = generateTenantName();

    testData.createAuthenticatedUser(userEmail, PASSWORD, tenantName).then((user) => {
      userJwt = user.jwt;
      userTenantId = user.tenantId;

      setAuthInLocalStorage(user.jwt, {
        userId: user.userId,
        email: userEmail,
        tenantId: user.tenantId,
        tenantName,
        role: 'ADMIN',
      });

      testData.createProject(user.jwt, user.tenantId, 'Items Test Project').then((proj) => {
        projectId = proj.id;
      });
    });
  });

  it('/itens shows table with Tipo, Título, and Status columns', () => {
    testData.createWorkItem(userJwt, userTenantId, projectId, 'Sample Task', 'TASK');

    cy.visit('/itens');
    cy.findByRole('columnheader', { name: /tipo|type/i }).should('be.visible');
    cy.findByRole('columnheader', { name: /título|title/i }).should('be.visible');
    cy.findByRole('columnheader', { name: /status/i }).should('be.visible');
  });

  it('type filter shows only matching items; clearing filter restores all', () => {
    testData.createWorkItem(userJwt, userTenantId, projectId, 'Feature Item', 'FEATURE');
    testData.createWorkItem(userJwt, userTenantId, projectId, 'Task Item', 'TASK');

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

  it('clicking an item opens its detail view with the correct ID', () => {
    testData
      .createWorkItem(userJwt, userTenantId, projectId, 'Detail Item', 'TASK')
      .then((item) => {
        cy.visit('/itens');
        cy.findByText('Detail Item').click();
        cy.url().should('include', item.id);
        cy.findByText('Detail Item').should('be.visible');
      });
  });

  it('tree view expands Feature to show US children, then US to show Tasks', () => {
    testData
      .createWorkItem(userJwt, userTenantId, projectId, 'Root Feature', 'FEATURE')
      .then((feature) => {
        testData
          .createWorkItem(
            userJwt,
            userTenantId,
            projectId,
            'Child Story',
            'USER_STORY',
            feature.id
          )
          .then((story) => {
            testData.createWorkItem(
              userJwt,
              userTenantId,
              projectId,
              'Nested Task',
              'TASK',
              story.id
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
      });
  });
});
