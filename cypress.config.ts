import { defineConfig } from 'cypress';
import { resolveEnvironment } from './cypress/support/environment';

const env = resolveEnvironment();

export default defineConfig({
  e2e: {
    baseUrl: env.baseUrl,
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    retries: { runMode: 2, openMode: 0 },
    env: {
      environment: env.environment,
      authApiUrl: env.authApiUrl,
      boardApiUrl: env.boardApiUrl,
    },
    setupNodeEvents(on, config) {
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
});
