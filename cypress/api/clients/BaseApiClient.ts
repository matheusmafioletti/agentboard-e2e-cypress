export interface ApiRequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: Cypress.RequestBody;
}

export class BaseApiClient {
  constructor(protected readonly baseUrl: string) {}

  protected request<T>(
    path: string,
    options: ApiRequestOptions,
    errorContext: string,
    failOnStatusCode = true
  ): Cypress.Chainable<T> {
    return cy
      .request({
        url: `${this.baseUrl}${path}`,
        method: options.method,
        headers: options.headers,
        body: options.body,
        failOnStatusCode,
      })
      .then((response): T => {
        if (!failOnStatusCode && (response.status < 200 || response.status >= 300)) {
          return response.body as T;
        }
        if (response.status < 200 || response.status >= 300) {
          throw new Error(
            `${errorContext} failed (${response.status}): ${JSON.stringify(response.body)}`
          );
        }
        return response.body as T;
      }) as Cypress.Chainable<T>;
  }

  protected jsonHeaders(jwt?: string, tenantId?: string): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }
    return headers;
  }
}
