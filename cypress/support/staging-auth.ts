import { AuthApiClient } from '../api/clients/AuthApiClient';
import { setAuthInLocalStorage } from './browser';
import { stagingCredentials } from './staging-credentials';

export function authenticateStagingUser(): Cypress.Chainable<void> {
  const creds = stagingCredentials();
  const auth = new AuthApiClient();
  return auth.login(creds.email, creds.password).then((login) => {
    setAuthInLocalStorage(login.token, {
      userId: creds.email,
      email: creds.email,
      tenantId: login.tenantId ?? '',
      tenantName: creds.tenantName,
      role: login.role ?? 'ADMIN',
    });
  });
}
