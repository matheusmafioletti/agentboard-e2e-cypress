import { testData } from '../../api/services/TestDataService';
import { setAuthInLocalStorage } from '../../support/browser';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Authentication — Session', () => {
  it('switching workspace via sidebar updates the active workspace name', () => {
    const email = generateEmail('switch');
    const tenantName1 = generateTenantName();
    const tenantName2 = generateTenantName();

    testData.createAuthenticatedUser(email, PASSWORD, tenantName1).then((user) => {
      testData.createSecondTenant(user.jwt, tenantName2).then(() => {
        setAuthInLocalStorage(user.jwt, {
          userId: user.userId,
          email,
          tenantId: user.tenantId,
          tenantName: tenantName1,
          role: 'ADMIN',
        });
      });
    });

    cy.visit('/inicio');
    cy.findByText(tenantName1).should('be.visible');

    cy.findByRole('button', { name: /trocar workspace|switch|workspaces|tenants/i }).click();
    cy.findByText(tenantName2).should('be.visible').click();
    cy.findByText(tenantName2).should('be.visible');
  });
});
