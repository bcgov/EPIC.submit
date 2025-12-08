/* eslint-disable no-undef */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    setupNodeEvents(on, config) {
      require("@cypress/code-coverage/task")(on, config);
      // include any other plugin code...

      // It's IMPORTANT to return the config object
      // with any changed environment variables
      return config;
    },
  },

  // E2E Testing Configuration
  e2e: {
    baseUrl: "http://localhost:5173", // Default, can be overridden via cypress.env.json
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    pageLoadTimeout: 60000, // Increased for OAuth redirects
    // Enable cross-origin testing for BCSC/BCeID login flows
    experimentalModifyObstructiveThirdPartyCode: true,
    chromeWebSecurity: false, // Required for cross-origin OAuth flow
    retries: {
      runMode: 2,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      // Allow baseUrl to be overridden via cypress.env.json
      if (config.env.BASE_URL) {
        config.baseUrl = config.env.BASE_URL;
      }
      return config;
    },
  },
});
