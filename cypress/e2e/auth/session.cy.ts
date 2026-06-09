import { generateEmail, generateWorkspaceName } from '../../support/test-utils';

describe('Authentication — Session [TC-AUTH-008]', () => {
  it('TC-AUTH-008: switching workspace via sidebar updates the active workspace name', () => {
    const email = generateEmail('switch');
    const wsName1 = generateWorkspaceName();
    const wsName2 = generateWorkspaceName();

    cy.registerViaApi(email, 'Abc12345!', wsName1).then((user) => {
      cy.createTenantViaApi(user.token, wsName2).then(() => {
        cy.setAuth(user.token, {
          userId: user.userId,
          email,
          tenantId: user.tenantId,
          tenantName: wsName1,
          role: 'ADMIN',
        });
      });
    });

    cy.visit('/inicio');
    cy.findByText(wsName1).should('be.visible');

    cy.findByRole('button', { name: /trocar workspace|switch|workspaces|tenants/i }).click();
    cy.findByText(wsName2).should('be.visible').click();
    cy.findByText(wsName2).should('be.visible');
  });
});
