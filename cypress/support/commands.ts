/**
 * Custom Cypress Commands for Lead Management Testing
 */

// TypeScript declarations for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      loginAsKAM(territories?: string[]): Chainable<void>;
      logout(): Chainable<void>;
      createMockLead(leadData?: Record<string, any>): Chainable<void>;
      updateLeadStatus(
        leadId: string,
        status: string,
        remarks: string
      ): Chainable<void>;
      openLeadTimeline(leadId: string): Chainable<void>;
      waitForLeadsToLoad(): Chainable<void>;
      selectLeadsForBulkAction(count: number): Chainable<void>;
      applyLeadFilters(filters: Record<string, any>): Chainable<void>;
      measurePageLoad(): Chainable<any>;
      measureApiResponse(url: string): Chainable<any>;
      checkA11yViolations(options?: Record<string, any>): Chainable<void>;
      checkA11y(
        context?: any,
        options?: any,
        violationCallback?: any
      ): Chainable<void>;
      lighthouse(options?: any): Chainable<void>;
      injectAxe(): Chainable<void>;
      tab(): Chainable<any>;
      seedTestData(dataType: string, count?: number): Chainable<void>;
      cleanupTestData(): Chainable<void>;
    }
  }
}

// Make this file a module
export {};

// Authentication Commands
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin-session', () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('admin@solarium.com');
    cy.get('[data-testid="password-input"]').type('admin123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-avatar"]').should('be.visible');
  });
});

Cypress.Commands.add('loginAsKAM', (territories = ['North']) => {
  cy.session(`kam-session-${territories.join('-')}`, () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('kam@solarium.com');
    cy.get('[data-testid="password-input"]').type('kam123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-avatar"]').should('be.visible');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Lead Management Commands
Cypress.Commands.add('createMockLead', (leadData = {}) => {
  const defaultLead = {
    customerName: 'Test Customer',
    customerPhone: '9876543210',
    address: '123 Test Street, Test City',
    pinCode: '123456',
    territory: 'North',
    ...leadData,
  };

  cy.intercept('POST', '/api/v1/leads', {
    statusCode: 201,
    body: {
      success: true,
      data: {
        leadId: 'LEAD-001',
        ...defaultLead,
      },
    },
  }).as('createLead');

  cy.get('[data-testid="add-lead-button"]').click();
  cy.get('[data-testid="customer-name-input"]').type(defaultLead.customerName);
  cy.get('[data-testid="customer-phone-input"]').type(
    defaultLead.customerPhone
  );
  cy.get('[data-testid="address-input"]').type(defaultLead.address);
  cy.get('[data-testid="pincode-input"]').type(defaultLead.pinCode);
  cy.get('[data-testid="create-lead-button"]').click();

  cy.wait('@createLead');
});

Cypress.Commands.add(
  'updateLeadStatus',
  (leadId: string, status: string, remarks: string) => {
    cy.intercept('PATCH', `/api/v1/leads/${leadId}/status`, {
      statusCode: 200,
      body: { success: true },
    }).as('updateStatus');

    cy.get(`[data-testid="lead-${leadId}-status"]`).click();
    cy.get('[data-testid="status-select"]').click();
    cy.get(`[data-value="${status}"]`).click();
    cy.get('[data-testid="remarks-input"]').type(remarks);
    cy.get('[data-testid="save-status-button"]').click();

    cy.wait('@updateStatus');
  }
);

Cypress.Commands.add('openLeadTimeline', (leadId: string) => {
  cy.get(`[data-testid="lead-${leadId}-timeline-button"]`).click();
  cy.get('[data-testid="timeline-drawer"]').should('be.visible');
});

// UI Interaction Commands
Cypress.Commands.add('waitForLeadsToLoad', () => {
  cy.get('[data-testid="leads-table"]').should('be.visible');
  cy.get('[data-testid="loading-skeleton"]').should('not.exist');
  cy.get('[data-testid="leads-count"]').should('contain.text', 'leads');
});

Cypress.Commands.add('selectLeadsForBulkAction', (count: number) => {
  // Select specific number of leads for bulk operations
  for (let i = 0; i < count && i < 50; i++) {
    cy.get(`[data-testid="lead-checkbox-${i}"]`).check();
  }
  cy.get('[data-testid="bulk-actions-toolbar"]').should('be.visible');
});

Cypress.Commands.add('applyLeadFilters', (filters: any) => {
  cy.get('[data-testid="filters-button"]').click();

  if (filters.status) {
    cy.get('[data-testid="status-filter"]').click();
    cy.get(`[data-value="${filters.status}"]`).click();
  }

  if (filters.search) {
    cy.get('[data-testid="search-input"]').type(filters.search);
  }

  if (filters.territory) {
    cy.get('[data-testid="territory-filter"]').click();
    cy.get(`[data-value="${filters.territory}"]`).click();
  }

  if (filters.dateFrom) {
    cy.get('[data-testid="date-from-input"]').type(filters.dateFrom);
  }

  if (filters.dateTo) {
    cy.get('[data-testid="date-to-input"]').type(filters.dateTo);
  }
});

// Performance Testing Commands
Cypress.Commands.add('measurePageLoad', () => {
  return cy.window().then(win => {
    return new Promise(resolve => {
      win.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = win.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const domReadyTime =
            perfData.domContentLoadedEventEnd - perfData.navigationStart;

          resolve({
            pageLoadTime,
            domReadyTime,
            dnsLookupTime:
              perfData.domainLookupEnd - perfData.domainLookupStart,
            serverResponseTime: perfData.responseEnd - perfData.requestStart,
          });
        }, 1000);
      });
    });
  });
});

Cypress.Commands.add('measureApiResponse', (url: string) => {
  const startTime = Date.now();

  return cy.request(url).then(response => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      responseTime,
      statusCode: response.status,
      responseSize: JSON.stringify(response.body).length,
    };
  });
});

// Accessibility Commands
Cypress.Commands.add('checkA11yViolations', (options = {}) => {
  const defaultOptions = {
    tags: ['wcag2a', 'wcag2aa'],
    includedImpacts: ['critical', 'serious'],
    ...options,
  };

  cy.checkA11y(undefined, defaultOptions, violations => {
    if (violations.length > 0) {
      cy.task('log', `Accessibility violations found: ${violations.length}`);
      violations.forEach(violation => {
        cy.task('log', `${violation.id}: ${violation.description}`);
        cy.task('log', `Help: ${violation.helpUrl}`);
      });
    }
  });
});

// Data Management Commands
Cypress.Commands.add('seedTestData', (dataType: string, count = 10) => {
  if (dataType === 'leads') {
    cy.task('generateMockLeads', count).then(mockLeads => {
      cy.intercept('GET', '/api/v1/leads*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            items: mockLeads,
            total: count,
            page: 1,
            limit: 25,
            offset: 0,
            totalPages: Math.ceil(count / 25),
          },
        },
      }).as('getLeads');
    });
  }
});

Cypress.Commands.add('cleanupTestData', () => {
  // Reset interceptors and clear any persisted data
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearAllSessionStorage();
});
