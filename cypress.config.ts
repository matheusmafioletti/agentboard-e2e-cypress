import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import { resolveEnvironment } from './cypress/support/environment';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const registerGrep = require('@cypress/grep/src/plugin');

dotenv.config();

const env = resolveEnvironment();

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    charts: true,
    reportPageTitle: 'AgentBoard Cypress E2E',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    overwrite: false,
    html: true,
    json: true,
  },
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
      grepTags: process.env.TEST_TAGS ?? '',
      grepFilterSpecs: true,
      grepOmitFiltered: true,
    },
    setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('cypress-mochawesome-reporter/plugin')(on);
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
      });
      return registerGrep(config);
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
