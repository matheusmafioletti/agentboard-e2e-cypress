import { generateEmail, generateWorkspaceName } from '../../support/test-utils';

describe('Users Management [TC-USERS-001..006]', () => {
  let adminToken = '';
  let adminTenantId = '';
  let adminEmail = '';
  let wsName = '';

  beforeEach(() => {
    adminEmail = generateEmail('admin');
    wsName = generateWorkspaceName();

    cy.registerViaApi(adminEmail, 'Abc12345!', wsName).then((user) => {
      adminToken = user.token;
      adminTenantId = user.tenantId;
      cy.setAuth(user.token, {
        userId: user.userId,
        email: adminEmail,
        tenantId: user.tenantId,
        tenantName: wsName,
        role: 'ADMIN',
      });
    });
  });

  it('TC-USERS-001: ADMIN accesses /usuarios and sees members list with email and role', () => {
    cy.visit('/usuarios');
    cy.url().should('include', '/usuarios');
    cy.findByText(adminEmail).should('be.visible');
    cy.findByText(/ADMIN/i).should('be.visible');
  });

  it('TC-USERS-002: USER role cannot access /usuarios and sidebar hides the "Usuários" link', () => {
    const userEmail = generateEmail('member');

    cy.createInviteViaApi(adminToken, adminTenantId, userEmail).then((invite) => {
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
            tenantId: adminTenantId,
          },
        ).then(({ body }) => {
          cy.setAuth(body.token, {
            userId: newUser.userId,
            email: userEmail,
            tenantId: adminTenantId,
            tenantName: wsName,
            role: 'USER',
          });
        });
      });
    });

    cy.visit('/inicio');
    cy.get('nav').findByText(/usuários|users/i).should('not.exist');

    cy.visit('/usuarios');
    cy.url().should('not.include', '/usuarios');
  });

  it('TC-USERS-003: ADMIN creates an invite and email appears in pending invites list', () => {
    const inviteEmail = generateEmail('invited');

    cy.visit('/usuarios');
    cy.findByRole('button', { name: /convidar|invite/i }).click();
    cy.findByLabelText(/email/i).type(inviteEmail);
    cy.findByRole('button', { name: /enviar|send|confirmar/i }).click();

    cy.findByText(inviteEmail).should('be.visible');
    cy.findByText(/pendente|pending/i).should('be.visible');
  });

  it('TC-USERS-004: ADMIN cancels an invite and email is removed from pending list', () => {
    const inviteEmail = generateEmail('cancel-invite');

    cy.createInviteViaApi(adminToken, adminTenantId, inviteEmail).then((invite) => {
      cy.visit('/usuarios');
      cy.findByText(inviteEmail).should('be.visible');

      cy.findByText(inviteEmail)
        .closest('[data-testid^="invite-row-"]')
        .findByRole('button', { name: /cancelar|cancel|remover|delete/i })
        .click();

      cy.findByRole('button', { name: /confirmar|confirm|yes/i }).click();

      cy.findByText(inviteEmail).should('not.exist');

      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('authApiUrl')}/auth/tenants/${adminTenantId}/invites/${invite.inviteId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        failOnStatusCode: false,
      });
    });
  });

  it('TC-USERS-005: new user accepts invite, is authenticated in the invite workspace with role USER', () => {
    const newUserEmail = generateEmail('accept-invite');

    cy.createInviteViaApi(adminToken, adminTenantId, newUserEmail).then((invite) => {
      cy.registerViaApi(newUserEmail, 'Abc12345!', generateWorkspaceName()).then(() => {
        cy.visit(`/invite/${invite.inviteToken}`);
        cy.findByRole('button', { name: /aceitar|accept|join/i }).click();

        cy.url().should('include', '/inicio');
        cy.findByText(wsName).should('be.visible');
        cy.get('[data-testid="user-role"]').should('contain.text', 'USER');
      });
    });
  });

  it('TC-USERS-006: invalid invite token shows error and hides acceptance form', () => {
    cy.visit('/invite/token-invalido-000');
    cy.findByRole('alert').should('be.visible');
    cy.findByRole('button', { name: /aceitar|accept|join/i }).should('not.exist');
  });
});
