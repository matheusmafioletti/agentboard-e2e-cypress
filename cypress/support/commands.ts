import '@testing-library/cypress/add-commands';

interface UserInfo {
  userId: string;
  email: string;
  tenantId: string;
  tenantName: string;
  role: string;
}

interface RegisterApiResponse {
  token: string;
  tenantId: string;
  userId: string;
}

interface CreateProjectResponse {
  id: string;
  name: string;
}

interface CreateWorkItemResponse {
  id: string;
}

interface CreateTenantResponse {
  tenantId: string;
}

interface CreateInviteResponse {
  inviteToken: string;
  inviteId: string;
}

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginViaApi(email: string, password: string): Chainable<void>;
      createWorkItem(title: string): Chainable<void>;
      registerViaApi(
        email: string,
        password: string,
        tenantName: string,
      ): Chainable<RegisterApiResponse>;
      setAuth(token: string, userInfo: UserInfo): Chainable<void>;
      createProjectViaApi(
        token: string,
        tenantId: string,
        name: string,
      ): Chainable<CreateProjectResponse>;
      createWorkItemViaApi(
        token: string,
        tenantId: string,
        projectId: string,
        title: string,
        type: string,
        parentId?: string,
      ): Chainable<CreateWorkItemResponse>;
      createTenantViaApi(token: string, tenantName: string): Chainable<CreateTenantResponse>;
      createInviteViaApi(
        token: string,
        tenantId: string,
        email: string,
      ): Chainable<CreateInviteResponse>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/senha|password/i).type(password);
    cy.findByRole('button', { name: /entrar|login/i }).click();
    cy.url().should('include', '/inicio');
  });
});

Cypress.Commands.add('loginViaApi', (email: string, password: string) => {
  cy.request('POST', `${Cypress.env('authApiUrl')}/auth/login`, { email, password }).then(
    ({ body }) => {
      window.localStorage.setItem('agentboard_token', body.token);
    },
  );
});

Cypress.Commands.add('createWorkItem', (title: string) => {
  cy.findByRole('button', { name: /nova tarefa|create/i }).click();
  cy.findByLabelText(/título|title/i).type(title);
  cy.findByRole('button', { name: /criar|create/i }).click();
  cy.findByText(title).should('be.visible');
});

Cypress.Commands.add('registerViaApi', (email: string, password: string, tenantName: string) => {
  return cy
    .request('POST', `${Cypress.env('authApiUrl')}/auth/register`, {
      name: 'Test User',
      email,
      password,
      tenantName,
    })
    .then(({ body }) => ({
      token: body.token,
      tenantId: body.tenantId,
      userId: body.userId ?? body.id,
    }));
});

Cypress.Commands.add('setAuth', (token: string, userInfo: UserInfo) => {
  cy.window().then((win) => {
    win.localStorage.setItem('agentboard_token', token);
    win.localStorage.setItem('agentboard_user', JSON.stringify(userInfo));
  });
});

Cypress.Commands.add('createProjectViaApi', (token: string, tenantId: string, name: string) => {
  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('boardApiUrl')}/projects`,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-Id': tenantId,
      },
      body: { name },
    })
    .then(({ body }) => ({ id: body.id as string, name: body.name as string }));
});

Cypress.Commands.add(
  'createWorkItemViaApi',
  (
    token: string,
    tenantId: string,
    projectId: string,
    title: string,
    type: string,
    parentId?: string,
  ) => {
    return cy
      .request({
        method: 'POST',
        url: `${Cypress.env('boardApiUrl')}/projects/${projectId}/work-items`,
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Id': tenantId,
        },
        body: { title, type, ...(parentId ? { parentId } : {}) },
      })
      .then(({ body }) => ({ id: body.id as string }));
  },
);

Cypress.Commands.add('createTenantViaApi', (token: string, tenantName: string) => {
  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('authApiUrl')}/auth/tenants`,
      headers: { Authorization: `Bearer ${token}` },
      body: { tenantName },
    })
    .then(({ body }) => ({ tenantId: body.tenantId as string }));
});

Cypress.Commands.add('createInviteViaApi', (token: string, tenantId: string, email: string) => {
  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('authApiUrl')}/auth/tenants/${tenantId}/invites`,
      headers: { Authorization: `Bearer ${token}` },
      body: { email },
    })
    .then(({ body }) => ({
      inviteToken: body.token as string,
      inviteId: body.id as string,
    }));
});
