import { AuthApiClient } from '../clients/AuthApiClient';
import { BoardApiClient } from '../clients/BoardApiClient';
import type { InviteResult, TenantResult, UserCredentials } from '../types/auth.types';
import type { ProjectResult, WorkItemResult, WorkItemType } from '../types/board.types';

export class TestDataService {
  private readonly authClient = new AuthApiClient();
  private readonly boardClient = new BoardApiClient();

  createAuthenticatedUser(
    email: string,
    password: string,
    tenantName: string
  ): Cypress.Chainable<UserCredentials> {
    return this.authClient.createAuthenticatedUser(email, password, tenantName);
  }

  createSecondTenant(jwt: string, tenantName: string): Cypress.Chainable<TenantResult> {
    return this.authClient.createTenant(jwt, tenantName);
  }

  createInvite(jwt: string, tenantId: string, email: string): Cypress.Chainable<InviteResult> {
    return this.authClient.createInvite(jwt, tenantId, email);
  }

  acceptInvite(token: string, email: string, password: string): Cypress.Chainable<null> {
    return this.authClient.acceptInvite(token, email, password);
  }

  selectTenant(
    email: string,
    password: string,
    tenantId: string
  ): Cypress.Chainable<{ token: string }> {
    return this.authClient.selectTenant(email, password, tenantId);
  }

  cancelInvite(jwt: string, tenantId: string, inviteId: string): Cypress.Chainable<null> {
    return this.authClient.cancelInvite(jwt, tenantId, inviteId);
  }

  createProject(jwt: string, tenantId: string, name: string): Cypress.Chainable<ProjectResult> {
    return this.boardClient.createProject(jwt, tenantId, name);
  }

  createWorkItem(
    jwt: string,
    tenantId: string,
    projectId: string,
    title: string,
    type: WorkItemType,
    parentId?: string
  ): Cypress.Chainable<WorkItemResult> {
    return this.boardClient.createWorkItem(jwt, tenantId, projectId, title, type, parentId);
  }
}

export const testData = new TestDataService();
