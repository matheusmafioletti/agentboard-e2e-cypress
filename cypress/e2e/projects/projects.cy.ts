import { generateEmail, generateWorkspaceName } from '../../support/test-utils';

describe('Projects [TC-PROJ-001..003]', () => {
  let userToken = '';
  let userTenantId = '';
  let userEmail = '';
  let wsName = '';

  beforeEach(() => {
    userEmail = generateEmail('proj');
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
    });
  });

  it('TC-PROJ-001: creating a project via UI makes it appear in the projects list', () => {
    cy.visit('/projetos');
    cy.findByRole('button', { name: /novo projeto|criar projeto|new project/i }).click();
    const projectName = `Proj-${Date.now()}`;
    cy.findByLabelText(/nome|name/i).type(projectName);
    cy.findByRole('button', { name: /criar|salvar|confirmar|save/i }).click();
    cy.findByText(projectName).should('be.visible');
  });

  it('TC-PROJ-002: clicking a project card navigates to /projetos/:id', () => {
    cy.createProjectViaApi(userToken, userTenantId, 'Click Target Project').then((proj) => {
      cy.visit('/projetos');
      cy.findByText('Click Target Project').click();
      cy.url().should('match', /\/projetos\/[^/]+$/);
      cy.url().should('include', proj.id);
    });
  });

  it('TC-PROJ-003: selecting a project via ProjectSelector updates the board context', () => {
    cy.createProjectViaApi(userToken, userTenantId, 'Selector Project').then(() => {
      cy.visit('/board');
      cy.findByRole('combobox', { name: /projeto|project/i })
        .should('be.visible')
        .select('Selector Project');
      cy.url().should('include', '/board');
      cy.findByText('Selector Project').should('be.visible');
    });
  });
});
