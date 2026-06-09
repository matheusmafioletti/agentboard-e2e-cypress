import { generateEmail, generateWorkspaceName } from '../../support/test-utils';

describe('Navigation — Sidebar [TC-NAV-001..003]', () => {
  it('TC-NAV-001: ADMIN sidebar contains "Usuários" link', () => {
    const email = generateEmail('nav-admin');
    const wsName = generateWorkspaceName();

    cy.registerViaApi(email, 'Abc12345!', wsName).then((user) => {
      cy.setAuth(user.token, {
        userId: user.userId,
        email,
        tenantId: user.tenantId,
        tenantName: wsName,
        role: 'ADMIN',
      });
    });

    cy.visit('/inicio');
    cy.get('nav').findByRole('link', { name: /usuários|users/i }).should('be.visible');
  });

  it('TC-NAV-002: USER role sidebar does NOT contain "Usuários" link', () => {
    const adminEmail = generateEmail('nav-admin2');
    const wsName = generateWorkspaceName();
    const userEmail = generateEmail('nav-user');

    cy.registerViaApi(adminEmail, 'Abc12345!', wsName).then((admin) => {
      cy.createInviteViaApi(admin.token, admin.tenantId, userEmail).then((invite) => {
        cy.registerViaApi(userEmail, 'Abc12345!', generateWorkspaceName()).then((newUser) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('authApiUrl')}/invite/accept`,
            headers: { Authorization: `Bearer ${newUser.token}` },
            body: { token: invite.inviteToken },
            failOnStatusCode: false,
          });

          cy.request(
            'POST',
            `${Cypress.env('authApiUrl')}/auth/select-tenant`,
            {
              email: userEmail,
              password: 'Abc12345!',
              tenantId: admin.tenantId,
            },
          ).then(({ body }) => {
            cy.setAuth(body.token, {
              userId: newUser.userId,
              email: userEmail,
              tenantId: admin.tenantId,
              tenantName: wsName,
              role: 'USER',
            });
          });
        });
      });
    });

    cy.visit('/inicio');
    cy.get('nav').findByText(/usuários|users/i).should('not.exist');
  });

  it('TC-NAV-003: /inicio with at least one project shows summary cards with counts', () => {
    const email = generateEmail('nav-inicio');
    const wsName = generateWorkspaceName();

    cy.registerViaApi(email, 'Abc12345!', wsName).then((user) => {
      cy.setAuth(user.token, {
        userId: user.userId,
        email,
        tenantId: user.tenantId,
        tenantName: wsName,
        role: 'ADMIN',
      });

      cy.createProjectViaApi(user.token, user.tenantId, 'Inicio Project').then((proj) => {
        cy.createWorkItemViaApi(user.token, user.tenantId, proj.id, 'Feature 1', 'FEATURE');
        cy.createWorkItemViaApi(user.token, user.tenantId, proj.id, 'Story 1', 'USER_STORY');
        cy.createWorkItemViaApi(user.token, user.tenantId, proj.id, 'Task 1', 'TASK');
      });
    });

    cy.visit('/inicio');
    cy.get('[data-testid^="summary-card-"]').should('have.length.gte', 1);
    cy.get('[data-testid^="summary-card-"]').each(($card) => {
      cy.wrap($card).find('[data-testid="summary-count"]').should('be.visible');
    });
  });
});
