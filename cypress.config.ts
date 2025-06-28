/**
 * Cypress Configuration for Lead Management E2E Tests
 * Includes performance monitoring and accessibility testing
 */

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.spec.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    experimentalStudio: true,

    // Performance and timeout settings
    defaultCommandTimeout: 10000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,

    setupNodeEvents(on, config) {
      // Lighthouse performance testing
      on('task', {
        lighthouse: require('cypress-audit/commands').lighthouse,
        lighthouseThresholds: {
          performance: 90,
          accessibility: 95,
          'best-practices': 85,
          seo: 85,
        },
      });

      // Custom tasks for test data management
      on('task', {
        // Mock large dataset for performance testing
        generateMockLeads: (count: number) => {
          const leads = [];
          for (let i = 1; i <= count; i++) {
            leads.push({
              id: `${i}`,
              leadId: `LEAD-${i.toString().padStart(3, '0')}`,
              customerName: `Customer ${i}`,
              customerPhone: `${1000000000 + i}`,
              address: `${i} Test Street, Test City`,
              pinCode: `${100000 + i}`,
              status: i % 5 === 0 ? 'Won' : 'New Lead',
              territory: ['North', 'South', 'East', 'West'][i % 4],
              origin: 'CP',
              createdBy: 'user1',
              createdAt: new Date(
                Date.now() - i * 24 * 60 * 60 * 1000
              ).toISOString(),
              updatedAt: new Date(
                Date.now() - i * 24 * 60 * 60 * 1000
              ).toISOString(),
            });
          }
          return leads;
        },

        // Log performance metrics
        logPerformance: (metrics: any) => {
          console.log('Performance Metrics:', JSON.stringify(metrics, null, 2));
          return null;
        },
      });

      // Environment-specific configuration
      if (config.env.environment === 'ci') {
        config.video = false;
        config.screenshotOnRunFailure = false;
      }

      return config;
    },
  },

  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
