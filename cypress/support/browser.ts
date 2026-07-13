import type { UserInfo } from '../api/types/auth.types';

export function setAuthInLocalStorage(jwt: string, userInfo: UserInfo): void {
  cy.window().then((win) => {
    win.localStorage.setItem('agentboard_token', jwt);
    win.localStorage.setItem('agentboard_user', JSON.stringify(userInfo));
  });
}
