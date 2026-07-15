import { resolveRuntimeApiUrl } from '../../support/environment';
import type {
  InviteResult,
  SelectTenantResult,
  TenantResult,
  UserCredentials,
} from '../types/auth.types';
import { BaseApiClient } from './BaseApiClient';

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64Payload = token.split('.')[1];
  const jsonString = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(jsonString) as Record<string, unknown>;
}

function extractLastPathSegment(url: string): string | null {
  const parts = url.split('/').filter(Boolean);
  return parts.length > 0 ? (parts[parts.length - 1] ?? null) : null;
}

export class AuthApiClient extends BaseApiClient {
  constructor() {
    super(resolveRuntimeApiUrl('authApiUrl'));
  }

  register(
    email: string,
    password: string,
    tenantName: string
  ): Cypress.Chainable<{
    tenantId: string;
    userId?: string;
    token?: string;
    role?: string;
  }> {
    return this.request(
      '/auth/register',
      {
        method: 'POST',
        headers: this.jsonHeaders(),
        body: { name: 'Test User', email, password, tenantName },
      },
      'Registration'
    );
  }

  login(
    email: string,
    password: string
  ): Cypress.Chainable<{ token: string; tenantId?: string; role?: string }> {
    return this.request(
      '/auth/login',
      {
        method: 'POST',
        headers: this.jsonHeaders(),
        body: { email, password },
      },
      'Login'
    );
  }

  createAuthenticatedUser(
    email: string,
    password: string,
    tenantName: string
  ): Cypress.Chainable<UserCredentials> {
    return this.register(email, password, tenantName).then((registerData) => {
      return this.login(email, password).then((loginData) => {
        const jwt = loginData.token;
        const payload = decodeJwtPayload(jwt);
        const userId =
          registerData.userId ?? (typeof payload.sub === 'string' ? payload.sub : '');
        const role =
          registerData.role ??
          loginData.role ??
          (typeof payload.role === 'string' ? payload.role : 'ADMIN');

        return {
          email,
          password,
          tenantName,
          jwt,
          tenantId: registerData.tenantId,
          userId,
          role,
        };
      });
    });
  }

  createTenant(jwt: string, tenantName: string): Cypress.Chainable<TenantResult> {
    return this.request<{ tenantId: string; tenantName: string }>(
      '/auth/tenants',
      {
        method: 'POST',
        headers: this.jsonHeaders(jwt),
        body: { tenantName },
      },
      'Create second tenant'
    ).then((data) => ({ tenantId: data.tenantId, tenantName: data.tenantName ?? tenantName }));
  }

  createInvite(jwt: string, tenantId: string, email: string): Cypress.Chainable<InviteResult> {
    return this.request<{
      token: string;
      inviteUrl?: string;
      inviteId?: string;
      id?: string;
    }>(
      `/auth/tenants/${tenantId}/invites`,
      {
        method: 'POST',
        headers: this.jsonHeaders(jwt),
        body: { email },
      },
      'Create invite'
    ).then((data) => {
      const inviteId =
        data.inviteId ??
        data.id ??
        extractLastPathSegment(data.inviteUrl ?? '') ??
        data.token;

      return { token: data.token, inviteId };
    });
  }

  acceptInvite(token: string, email: string, password: string): Cypress.Chainable<null> {
    return this.request<Record<string, unknown>>(
      `/auth/invites/${token}/accept`,
      {
        method: 'POST',
        headers: this.jsonHeaders(),
        body: { email, password },
      },
      'Accept invite',
      false
    ).then((): null => null) as Cypress.Chainable<null>;
  }

  selectTenant(
    email: string,
    password: string,
    tenantId: string
  ): Cypress.Chainable<SelectTenantResult> {
    return this.request<SelectTenantResult>(
      '/auth/select-tenant',
      {
        method: 'POST',
        headers: this.jsonHeaders(),
        body: { email, password, tenantId },
      },
      'Select tenant'
    );
  }

  cancelInvite(jwt: string, tenantId: string, inviteId: string): Cypress.Chainable<null> {
    return this.request<Record<string, unknown>>(
      `/auth/tenants/${tenantId}/invites/${inviteId}`,
      {
        method: 'DELETE',
        headers: this.jsonHeaders(jwt),
      },
      'Cancel invite',
      false
    ).then((): null => null) as Cypress.Chainable<null>;
  }
}
