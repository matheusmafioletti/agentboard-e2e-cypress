import { authenticateStagingUser } from '../../support/staging-auth';
import { testData } from '../../api/services/TestDataService';
import { setAuthInLocalStorage } from '../../support/browser';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Projects', () => {
  it('project list is visible after seed login', { tags: '@staging' }, () => {
    authenticateStagingUser();
    cy.visit('/projetos');
    cy.get('[data-testid^="project-card-"], [data-testid="project-list"]')
      .should('have.length.gte', 1);
  });

  let userJwt = '';
  let userTenantId = '';
  let userEmail = '';
  let tenantName = '';

  beforeEach(() => {
    userEmail = generateEmail('proj');
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
    });
  });

  it('creating a project via UI makes it appear in the projects list', { tags: '@local' }, () => {
    cy.visit('/projetos');
    cy.findByRole('button', { name: /novo projeto/i }).first().click();
    const projectName = `Proj-${Date.now()}`;
    cy.get('#project-name').type(projectName);
    cy.findByRole('button', { name: /^criar$/i }).click();
    cy.findByText(projectName).should('be.visible');
  });

  it('clicking a project card navigates to /projetos/:id', { tags: '@local' }, () => {
    testData.createProject(userJwt, userTenantId, 'Click Target Project').then((proj) => {
      cy.visit('/projetos');
      cy.findByText('Click Target Project').click();
      cy.url().should('match', /\/projetos\/[^/]+$/);
      cy.url().should('include', proj.id);
    });
  });

  it('selecting a project via ProjectSelector updates the board context', { tags: '@wip' }, () => {
    testData.createProject(userJwt, userTenantId, 'Selector Project').then(() => {
      cy.visit('/board');
      cy.findByRole('combobox', { name: /projeto|project/i })
        .should('be.visible')
        .select('Selector Project');
      cy.url().should('include', '/board');
      cy.findByText('Selector Project').should('be.visible');
    });
  });
});
