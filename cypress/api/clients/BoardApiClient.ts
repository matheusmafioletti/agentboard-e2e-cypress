import { env } from '../../support/environment';
import type { ProjectResult, WorkItemResult, WorkItemType } from '../types/board.types';
import { BaseApiClient } from './BaseApiClient';

export class BoardApiClient extends BaseApiClient {
  constructor() {
    super(env.boardApiUrl);
  }

  createProject(jwt: string, tenantId: string, name: string): Cypress.Chainable<ProjectResult> {
    return this.request<ProjectResult>(
      '/api/v1/projects',
      {
        method: 'POST',
        headers: this.jsonHeaders(jwt, tenantId),
        body: { name },
      },
      'Create project'
    );
  }

  createWorkItem(
    jwt: string,
    tenantId: string,
    projectId: string,
    title: string,
    type: WorkItemType,
    parentId?: string
  ): Cypress.Chainable<WorkItemResult> {
    const body: Record<string, string> = { title, type };
    if (parentId) {
      body['parentId'] = parentId;
    }

    return this.request<WorkItemResult>(
      `/api/v1/work-items?projectId=${encodeURIComponent(projectId)}`,
      {
        method: 'POST',
        headers: this.jsonHeaders(jwt, tenantId),
        body,
      },
      'Create work item'
    );
  }
}
