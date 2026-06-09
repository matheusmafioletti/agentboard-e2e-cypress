import { generateEmail, generateWorkspaceName } from '../../support/test-utils';

describe('Kanban Board Flow [TC-BOARD-001..008]', () => {
  let userToken = '';
  let userTenantId = '';
  let projectId = '';
  let userEmail = '';
  let wsName = '';

  beforeEach(() => {
    userEmail = generateEmail('board');
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

      cy.createProjectViaApi(user.token, user.tenantId, 'Board Test Project').then((proj) => {
        projectId = proj.id;
      });
    });
  });

  it('TC-BOARD-001: default board shows TASK columns (New, Active, Closed)', () => {
    cy.visit('/board?type=TASK');
    cy.findByText('New').should('be.visible');
    cy.findByText('Active').should('be.visible');
    cy.findByText('Closed').should('be.visible');
  });

  it('TC-BOARD-002: switching type changes the columns count', () => {
    cy.visit('/board?type=FEATURE');
    cy.get('[data-testid^="column-"]').should('have.length', 9);

    cy.visit('/board?type=USER_STORY');
    cy.get('[data-testid^="column-"]').should('have.length', 5);

    cy.visit('/board?type=TASK');
    cy.get('[data-testid^="column-"]').should('have.length', 3);
  });

  it('TC-BOARD-003: creating a work item via UI places it in the "New" column', () => {
    cy.visit('/board?type=TASK');
    cy.findByRole('button', { name: /nova tarefa|novo item|create/i }).click();
    const itemTitle = `Task-${Date.now()}`;
    cy.findByLabelText(/título|title/i).type(itemTitle);
    cy.findByRole('button', { name: /criar|confirmar|save/i }).click();
    cy.findByText(itemTitle).should('be.visible');
    cy.get('[data-testid="column-new"]').findByText(itemTitle).should('be.visible');
  });

  it('TC-BOARD-004: drag-and-drop moves card to target column and persists on reload', () => {
    // NOTE: dnd-kit uses pointer events; mouse simulation required
    cy.createWorkItemViaApi(userToken, userTenantId, projectId, 'Drag Me Task', 'TASK').then(
      () => {
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
      },
    );
  });

  it('TC-BOARD-005: parent filter shows only child tasks; clearing filter restores all items', () => {
    cy.createWorkItemViaApi(userToken, userTenantId, projectId, 'Parent Feature', 'FEATURE').then(
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
            'Child Task',
            'TASK',
            story.id,
          );
          cy.createWorkItemViaApi(
            userToken,
            userTenantId,
            projectId,
            'Unrelated Task',
            'TASK',
          );

          cy.visit(`/board?type=TASK&parentId=${story.id}`);
          cy.findByText('Child Task').should('be.visible');
          cy.findByText('Unrelated Task').should('not.exist');

          cy.visit('/board?type=TASK');
          cy.findByText('Child Task').should('be.visible');
          cy.findByText('Unrelated Task').should('be.visible');
        });
      },
    );
  });

  it('TC-BOARD-006: card shows display ID, type badge, and parent reference', () => {
    cy.createWorkItemViaApi(userToken, userTenantId, projectId, 'Parent Story', 'USER_STORY').then(
      (story) => {
        cy.createWorkItemViaApi(
          userToken,
          userTenantId,
          projectId,
          'Card With Parent',
          'TASK',
          story.id,
        ).then(() => {
          cy.visit('/board?type=TASK');
          cy.findByText('Card With Parent')
            .closest('[data-testid^="card-"]')
            .within(() => {
              cy.get('[data-testid="card-id"]').should('be.visible');
              cy.get('[data-testid="card-type-badge"]').should('be.visible');
              cy.get('[data-testid="card-parent-ref"]').should('be.visible');
            });
        });
      },
    );
  });

  it('TC-BOARD-007: clicking a Feature card navigates to child USER_STORY board with parent pre-selected', () => {
    cy.createWorkItemViaApi(
      userToken,
      userTenantId,
      projectId,
      'Feature To Drill',
      'FEATURE',
    ).then((feature) => {
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

  it('TC-BOARD-008: clicking a card opens CardModal with title, type, and status', () => {
    cy.createWorkItemViaApi(
      userToken,
      userTenantId,
      projectId,
      'Modal Test Task',
      'TASK',
    ).then(() => {
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
