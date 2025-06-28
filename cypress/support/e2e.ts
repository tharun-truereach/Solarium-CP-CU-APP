/**
 * Cypress E2E Support File
 * Global commands, utilities, and test helpers
 */

import './commands';
import 'cypress-axe';
import 'cypress-audit/commands';

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore specific errors that don't affect functionality
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }

  // Log other errors but don't fail the test
  cy.log(`Uncaught exception: ${err.message}`);
  return false;
});

// Global before hook for common setup
beforeEach(() => {
  // Preserve cookies and localStorage across tests
  Cypress.Cookies.preserveOnce('session_token', 'user_data');

  // Set up viewport for consistent testing
  cy.viewport(1280, 720);

  // Inject axe for accessibility testing
  cy.injectAxe();
});

// Global after hook for cleanup
afterEach(() => {
  // Capture performance metrics
  cy.window().then(win => {
    if (win.performance && win.performance.getEntriesByType) {
      const navigationTiming = win.performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        const metrics = {
          loadTime:
            navigationTiming.loadEventEnd - navigationTiming.navigationStart,
          domReady:
            navigationTiming.domContentLoadedEventEnd -
            navigationTiming.navigationStart,
          firstPaint:
            win.performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint:
            win.performance.getEntriesByName('first-contentful-paint')[0]
              ?.startTime || 0,
        };

        cy.task('logPerformance', metrics);
      }
    }
  });
});

// Custom Cypress types
declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      loginAsAdmin(): Chainable<void>;
      loginAsKAM(territories?: string[]): Chainable<void>;
      logout(): Chainable<void>;

      // Lead management commands
      createMockLead(leadData?: Partial<any>): Chainable<void>;
      updateLeadStatus(
        leadId: string,
        status: string,
        remarks: string
      ): Chainable<void>;
      openLeadTimeline(leadId: string): Chainable<void>;

      // UI interaction commands
      waitForLeadsToLoad(): Chainable<void>;
      selectLeadsForBulkAction(count: number): Chainable<void>;
      applyLeadFilters(filters: any): Chainable<void>;

      // Performance testing commands
      measurePageLoad(): Chainable<any>;
      measureApiResponse(url: string): Chainable<any>;

      // Accessibility commands
      checkA11yViolations(options?: any): Chainable<void>;

      // Data management commands
      seedTestData(dataType: string, count?: number): Chainable<void>;
      cleanupTestData(): Chainable<void>;
    }
  }
}
