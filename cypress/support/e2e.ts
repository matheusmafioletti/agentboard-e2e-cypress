import '@cypress/grep';
import './commands';
import '@cypress/grep';

beforeEach(() => {
  cy.clearAllSessionStorage();
  cy.clearAllCookies();
});
