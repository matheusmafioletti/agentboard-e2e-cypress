import { testData } from '../../api/services/TestDataService';
import { authenticateStagingUser } from '../../support/staging-auth';
import { setAuthInLocalStorage } from '../../support/browser';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Navigation — Sidebar', () => {
  it('ADMIN sidebar contains "Usuários" link', { tags: '@staging' }, () => {
    authenticateStagingUser();
    cy.visit('/inicio');
    cy.get('nav').findByRole('link', { name: /usuários|users/i }).should('be.visible');
  });

  it('USER role sidebar does NOT contain "Usuários" link', { tags: '@local' }, () => {
    const adminEmail = generateEmail('nav-admin2');
    const tenantName = generateTenantName();
    const userEmail = generateEmail('nav-user');

    testData.createAuthenticatedUser(adminEmail, PASSWORD, tenantName).then((admin) => {
      testData.createInvite(admin.jwt, admin.tenantId, userEmail).then((invite) => {
        testData
          .createAuthenticatedUser(userEmail, PASSWORD, generateTenantName())
          .then((newUser) => {
            testData.acceptInvite(invite.token, userEmail, PASSWORD);
            testData.selectTenant(userEmail, PASSWORD, admin.tenantId).then((session) => {
              setAuthInLocalStorage(session.token, {
                userId: newUser.userId,
                email: userEmail,
                tenantId: admin.tenantId,
                tenantName,
                role: 'USER',
              });
            });
          });
      });
    });

    cy.visit('/inicio');
    cy.get('nav').findByText(/usuários|users/i).should('not.exist');
  });

  it('/inicio with at least one project shows summary cards with counts', { tags: '@local' }, () => {
    const email = generateEmail('nav-inicio');
    const tenantName = generateTenantName();

    testData.createAuthenticatedUser(email, PASSWORD, tenantName).then((user) => {
      setAuthInLocalStorage(user.jwt, {
        userId: user.userId,
        email,
        tenantId: user.tenantId,
        tenantName,
        role: 'ADMIN',
      });

      testData.createProject(user.jwt, user.tenantId, 'Inicio Project').then((proj) => {
        testData.createWorkItem(user.jwt, user.tenantId, proj.id, 'Feature 1', 'FEATURE');
        testData.createWorkItem(user.jwt, user.tenantId, proj.id, 'Story 1', 'USER_STORY');
        testData.createWorkItem(user.jwt, user.tenantId, proj.id, 'Task 1', 'TASK');
      });
    });

    cy.visit('/inicio');
    cy.get('[data-testid^="summary-card-"]').should('have.length.gte', 1);
    cy.get('[data-testid^="summary-card-"]').each(($card) => {
      cy.wrap($card).find('[data-testid="summary-count"]').should('be.visible');
    });
  });
});
