import { testData } from '../../api/services/TestDataService';
import { setAuthInLocalStorage } from '../../support/browser';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Users Management', () => {
  let adminJwt = '';
  let adminTenantId = '';
  let adminEmail = '';
  let tenantName = '';

  beforeEach(() => {
    adminEmail = generateEmail('admin');
    tenantName = generateTenantName();

    testData.createAuthenticatedUser(adminEmail, PASSWORD, tenantName).then((user) => {
      adminJwt = user.jwt;
      adminTenantId = user.tenantId;
      setAuthInLocalStorage(user.jwt, {
        userId: user.userId,
        email: adminEmail,
        tenantId: user.tenantId,
        tenantName,
        role: 'ADMIN',
      });
    });
  });

  it('ADMIN accesses /usuarios and sees members list with email and role', () => {
    cy.visit('/usuarios');
    cy.url().should('include', '/usuarios');
    cy.findByText(adminEmail).should('be.visible');
    cy.findByText(/ADMIN/i).should('be.visible');
  });

  it('USER role cannot access /usuarios and sidebar hides the "Usuários" link', () => {
    const userEmail = generateEmail('member');

    testData.createInvite(adminJwt, adminTenantId, userEmail).then((invite) => {
      testData.createAuthenticatedUser(userEmail, PASSWORD, generateTenantName()).then((newUser) => {
        testData.acceptInvite(invite.token, userEmail, PASSWORD);
        testData.selectTenant(userEmail, PASSWORD, adminTenantId).then((session) => {
          setAuthInLocalStorage(session.token, {
            userId: newUser.userId,
            email: userEmail,
            tenantId: adminTenantId,
            tenantName,
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

  it('ADMIN creates an invite and email appears in pending invites list', () => {
    const inviteEmail = generateEmail('invited');

    cy.visit('/usuarios');
    cy.findByRole('button', { name: /convidar|invite/i }).click();
    cy.findByLabelText(/email/i).type(inviteEmail);
    cy.findByRole('button', { name: /enviar|send|confirmar/i }).click();

    cy.findByText(inviteEmail).should('be.visible');
    cy.findByText(/pendente|pending/i).should('be.visible');
  });

  it('ADMIN cancels an invite and email is removed from pending list', () => {
    const inviteEmail = generateEmail('cancel-invite');

    testData.createInvite(adminJwt, adminTenantId, inviteEmail).then((invite) => {
      cy.visit('/usuarios');
      cy.findByText(inviteEmail).should('be.visible');

      cy.findByText(inviteEmail)
        .closest('[data-testid^="invite-row-"]')
        .findByRole('button', { name: /cancelar|cancel|remover|delete/i })
        .click();

      cy.findByRole('button', { name: /confirmar|confirm|yes/i }).click();

      cy.findByText(inviteEmail).should('not.exist');

      testData.cancelInvite(adminJwt, adminTenantId, invite.inviteId);
    });
  });

  it('new user accepts invite, is authenticated in the invite workspace with role USER', () => {
    const newUserEmail = generateEmail('accept-invite');

    testData.createInvite(adminJwt, adminTenantId, newUserEmail).then((invite) => {
      testData.createAuthenticatedUser(newUserEmail, PASSWORD, generateTenantName()).then(() => {
        cy.visit(`/invite/${invite.token}`);
        cy.findByRole('button', { name: /aceitar|accept|join/i }).click();

        cy.url().should('include', '/inicio');
        cy.findByText(tenantName).should('be.visible');
        cy.get('[data-testid="user-role"]').should('contain.text', 'USER');
      });
    });
  });

  it('invalid invite token shows error and hides acceptance form', () => {
    cy.visit('/invite/token-invalido-000');
    cy.findByRole('alert').should('be.visible');
    cy.findByRole('button', { name: /aceitar|accept|join/i }).should('not.exist');
  });
});
