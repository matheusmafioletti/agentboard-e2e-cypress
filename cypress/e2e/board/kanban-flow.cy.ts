import { testData } from '../../api/services/TestDataService';
import { setAuthInLocalStorage } from '../../support/browser';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Kanban Board Flow', () => {
  let userJwt = '';
  let userTenantId = '';
  let projectId = '';
  let userEmail = '';
  let tenantName = '';

  beforeEach(() => {
    userEmail = generateEmail('board');
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

      testData.createProject(user.jwt, user.tenantId, 'Board Test Project').then((proj) => {
        projectId = proj.id;
      });
    });
  });

  it('default board shows TASK columns (New, Active, Closed)', () => {
    cy.visit('/board?type=TASK');
    cy.findByText('New').should('be.visible');
    cy.findByText('Active').should('be.visible');
    cy.findByText('Closed').should('be.visible');
  });

  it('switching type changes the columns count', () => {
    cy.visit('/board?type=FEATURE');
    cy.get('[data-testid^="column-"]').should('have.length', 9);

    cy.visit('/board?type=USER_STORY');
    cy.get('[data-testid^="column-"]').should('have.length', 5);

    cy.visit('/board?type=TASK');
    cy.get('[data-testid^="column-"]').should('have.length', 3);
  });

  it('creating a work item via UI places it in the "New" column', () => {
    cy.visit('/board?type=TASK');
    cy.findByRole('button', { name: /nova tarefa|novo item|create/i }).click();
    const itemTitle = `Task-${Date.now()}`;
    cy.findByLabelText(/título|title/i).type(itemTitle);
    cy.findByRole('button', { name: /criar|confirmar|save/i }).click();
    cy.findByText(itemTitle).should('be.visible');
    cy.get('[data-testid="column-new"]').findByText(itemTitle).should('be.visible');
  });

  it('drag-and-drop moves card to target column and persists on reload', () => {
    // NOTE: dnd-kit uses pointer events; mouse simulation required
    testData
      .createWorkItem(userJwt, userTenantId, projectId, 'Drag Me Task', 'TASK')
      .then(() => {
        cy.visit('/board?type=TASK');
        cy.findByText('Drag Me Task').should('be.visible');

        cy.get('[data-testid="column-new"]')
          .findByText('Drag Me Task')
          .closest('[data-testid^="card-"]')
          .as('dragCard');

        cy.get('@dragCard').trigger('mousedown', { button: 0, force: true });
        cy.get('@dragCard').trigger('mousemove', { clientX: 10, clientY: 10, force: true });

        cy.get('[data-testid="column-active"]').trigger('mousemove', { force: true });
        cy.get('[data-testid="column-active"]').trigger('mouseup', { force: true });

        cy.get('[data-testid="column-active"]')
          .findByText('Drag Me Task')
          .should('be.visible');

        cy.reload();
        cy.get('[data-testid="column-active"]')
          .findByText('Drag Me Task')
          .should('be.visible');
      });
  });

  it('parent filter shows only child tasks; clearing filter restores all items', () => {
    testData
      .createWorkItem(userJwt, userTenantId, projectId, 'Parent Feature', 'FEATURE')
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
              'Child Task',
              'TASK',
              story.id
            );
            testData.createWorkItem(userJwt, userTenantId, projectId, 'Unrelated Task', 'TASK');

            cy.visit(`/board?type=TASK&parentId=${story.id}`);
            cy.findByText('Child Task').should('be.visible');
            cy.findByText('Unrelated Task').should('not.exist');

            cy.visit('/board?type=TASK');
            cy.findByText('Child Task').should('be.visible');
            cy.findByText('Unrelated Task').should('be.visible');
          });
      });
  });

  it('card shows display ID, type badge, and parent reference', () => {
    testData
      .createWorkItem(userJwt, userTenantId, projectId, 'Parent Story', 'USER_STORY')
      .then((story) => {
        testData
          .createWorkItem(
            userJwt,
            userTenantId,
            projectId,
            'Card With Parent',
            'TASK',
            story.id
          )
          .then(() => {
            cy.visit('/board?type=TASK');
            cy.findByText('Card With Parent')
              .closest('[data-testid^="card-"]')
              .within(() => {
                cy.get('[data-testid="card-id"]').should('be.visible');
                cy.get('[data-testid="card-type-badge"]').should('be.visible');
                cy.get('[data-testid="card-parent-ref"]').should('be.visible');
              });
          });
      });
  });

  it('clicking a Feature card navigates to child USER_STORY board with parent pre-selected', () => {
    testData
      .createWorkItem(userJwt, userTenantId, projectId, 'Feature To Drill', 'FEATURE')
      .then((feature) => {
        cy.visit('/board?type=FEATURE');
        cy.findByText('Feature To Drill')
          .closest('[data-testid^="card-"]')
          .findByRole('link', { name: /user stor|histórias|child/i })
          .click();

        cy.url().should('include', '/board');
        cy.url().should('include', 'type=USER_STORY');
        cy.url().should('include', `parentId=${feature.id}`);
      });
  });

  it('clicking a card opens CardModal with title, type, and status', () => {
    testData
      .createWorkItem(userJwt, userTenantId, projectId, 'Modal Test Task', 'TASK')
      .then(() => {
        cy.visit('/board?type=TASK');
        cy.findByText('Modal Test Task').click();
        cy.findByRole('dialog').should('be.visible').within(() => {
          cy.findByText('Modal Test Task').should('be.visible');
          cy.get('[data-testid="card-type-badge"]').should('be.visible');
          cy.findByText(/new|active|closed/i).should('be.visible');
        });
      });
  });
});
