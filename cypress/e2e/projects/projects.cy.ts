import { testData } from '../../api/services/TestDataService';
import { setAuthInLocalStorage } from '../../support/browser';
import { generateEmail, generateTenantName } from '../../support/generators';

const PASSWORD = 'Abc12345!';

describe('Projects', () => {
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

  it('creating a project via UI makes it appear in the projects list', () => {
    cy.visit('/projetos');
    cy.findByRole('button', { name: /novo projeto|criar projeto|new project/i }).click();
    const projectName = `Proj-${Date.now()}`;
    cy.findByLabelText(/nome|name/i).type(projectName);
    cy.findByRole('button', { name: /criar|salvar|confirmar|save/i }).click();
    cy.findByText(projectName).should('be.visible');
  });

  it('clicking a project card navigates to /projetos/:id', () => {
    testData.createProject(userJwt, userTenantId, 'Click Target Project').then((proj) => {
      cy.visit('/projetos');
      cy.findByText('Click Target Project').click();
      cy.url().should('match', /\/projetos\/[^/]+$/);
      cy.url().should('include', proj.id);
    });
  });

  it('selecting a project via ProjectSelector updates the board context', () => {
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
