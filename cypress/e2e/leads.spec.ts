/**
 * Comprehensive E2E Tests for Lead Management
 * Tests admin workflow, KAM territory restrictions, and performance
 */

describe('Lead Management E2E Tests', () => {
  beforeEach(() => {
    cy.cleanupTestData();
  });

  describe('Admin Lead Management Workflow', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/leads');
    });

    it('should complete full lead lifecycle as admin user', () => {
      // Performance measurement
      cy.measurePageLoad().then((metrics: any) => {
        expect(metrics.pageLoadTime).to.be.lessThan(2000); // < 2 seconds
        expect(metrics.domReadyTime).to.be.lessThan(1500); // < 1.5 seconds
      });

      // Create new lead
      cy.get('[data-testid="add-lead-fab"]').click();
      cy.get('[data-testid="customer-name-input"]').type('John Doe');
      cy.get('[data-testid="customer-phone-input"]').type('9876543210');
      cy.get('[data-testid="address-input"]').type(
        '123 Solar Street, Green City'
      );
      cy.get('[data-testid="pincode-input"]').type('123456');
      cy.get('[data-testid="territory-select"]').click();
      cy.get('[data-value="North"]').click();
      cy.get('[data-testid="create-lead-button"]').click();

      // Verify lead creation
      cy.get('[data-testid="toast-success"]').should(
        'contain',
        'Lead created successfully'
      );
      cy.waitForLeadsToLoad();
      cy.get('[data-testid="leads-table"]').should('contain', 'John Doe');

      // Update lead status
      cy.get('[data-testid="lead-LEAD-001-status"]').click();
      cy.get('[data-testid="status-select"]').click();
      cy.get('[data-value="In Discussion"]').click();
      cy.get('[data-testid="remarks-input"]').type(
        'Customer showed strong interest in solar installation'
      );
      cy.get('[data-testid="follow-up-date-input"]').type('2024-02-15');
      cy.get('[data-testid="save-status-button"]').click();

      // Verify status update
      cy.get('[data-testid="toast-success"]').should(
        'contain',
        'Status updated successfully'
      );
      cy.get('[data-testid="lead-LEAD-001-status"]').should(
        'contain',
        'In Discussion'
      );

      // View timeline
      cy.get('[data-testid="lead-LEAD-001-timeline-button"]').click();
      cy.get('[data-testid="timeline-drawer"]').should('be.visible');
      cy.get('[data-testid="timeline-item"]').should('have.length.at.least', 2);
      cy.get('[data-testid="timeline-item"]')
        .first()
        .should('contain', 'Status Changed');
      cy.get('[data-testid="timeline-close-button"]').click();

      // Test accessibility
      cy.checkA11yViolations();
    });

    it('should handle bulk operations for up to 50 leads', () => {
      // Seed large dataset
      cy.seedTestData('leads', 100);
      cy.reload();
      cy.waitForLeadsToLoad();

      // Select leads for bulk action
      cy.selectLeadsForBulkAction(50);
      cy.get('[data-testid="selected-count"]').should(
        'contain',
        '50 leads selected'
      );

      // Attempt to select more (should be limited)
      cy.get('[data-testid="select-all-checkbox"]').check();
      cy.get('[data-testid="selected-count"]').should(
        'contain',
        '50 leads selected (maximum)'
      );

      // Bulk status update
      cy.get('[data-testid="bulk-update-status-button"]').click();
      cy.get('[data-testid="bulk-status-select"]').click();
      cy.get('[data-value="Not Responding"]').click();
      cy.get('[data-testid="bulk-remarks-input"]').type(
        'Bulk update - no response from customers'
      );
      cy.get('[data-testid="confirm-bulk-update"]').click();

      // Verify bulk update
      cy.get('[data-testid="toast-success"]').should(
        'contain',
        '50 leads updated successfully'
      );

      // Performance check - bulk operation should complete within 5 seconds
      cy.get('[data-testid="bulk-actions-toolbar"]', { timeout: 5000 }).should(
        'not.exist'
      );
    });

    it('should export leads to CSV', () => {
      cy.seedTestData('leads', 25);
      cy.reload();
      cy.waitForLeadsToLoad();

      // Apply filters
      cy.applyLeadFilters({
        status: 'New Lead',
        territory: 'North',
      });

      // Export filtered results
      cy.get('[data-testid="export-button"]').click();
      cy.get('[data-testid="export-csv-option"]').click();

      // Verify download
      cy.readFile('cypress/downloads/leads-export.csv').should('exist');
    });

    it('should handle large dataset performance (1000 leads)', () => {
      // Mock large dataset
      cy.seedTestData('leads', 1000);

      // Measure initial load time
      const startTime = Date.now();
      cy.visit('/leads');
      cy.waitForLeadsToLoad();

      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(2000); // Should load within 2 seconds
      });

      // Test pagination performance
      cy.get('[data-testid="pagination-next"]').click();
      cy.waitForLeadsToLoad();
      cy.get('[data-testid="leads-table"] tbody tr').should('have.length', 25);

      // Test search performance
      cy.get('[data-testid="search-input"]').type('Customer 500');
      cy.get('[data-testid="leads-table"] tbody tr').should('have.length', 1);

      // Test filter performance
      cy.applyLeadFilters({ status: 'Won' });
      cy.waitForLeadsToLoad();
      cy.get('[data-testid="leads-count"]').should('contain', 'leads found');
    });
  });

  describe('KAM Territory Restrictions', () => {
    beforeEach(() => {
      cy.loginAsKAM(['North']);
      cy.visit('/leads');
    });

    it('should only show leads in assigned territory', () => {
      // Mock mixed territory data
      const mixedLeads = [
        {
          id: '1',
          leadId: 'LEAD-001',
          customerName: 'North Customer',
          territory: 'North',
        },
        {
          id: '2',
          leadId: 'LEAD-002',
          customerName: 'South Customer',
          territory: 'South',
        },
        {
          id: '3',
          leadId: 'LEAD-003',
          customerName: 'North Customer 2',
          territory: 'North',
        },
      ];

      cy.intercept('GET', '/api/v1/leads*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            items: mixedLeads.filter(lead => lead.territory === 'North'),
            total: 2,
            page: 1,
            limit: 25,
            offset: 0,
          },
        },
      }).as('getFilteredLeads');

      cy.reload();
      cy.waitForLeadsToLoad();

      // Should only see North territory leads
      cy.get('[data-testid="leads-table"]').should('contain', 'North Customer');
      cy.get('[data-testid="leads-table"]').should(
        'contain',
        'North Customer 2'
      );
      cy.get('[data-testid="leads-table"]').should(
        'not.contain',
        'South Customer'
      );
      cy.get('[data-testid="leads-count"]').should('contain', '2 leads');
    });

    it('should return 403 when attempting to access forbidden lead', () => {
      // Direct URL access to restricted lead
      cy.intercept('GET', '/api/v1/leads/LEAD-SOUTH-001', {
        statusCode: 403,
        body: {
          success: false,
          message: 'Access denied to lead outside your territory',
        },
      }).as('forbiddenAccess');

      cy.visit('/leads/LEAD-SOUTH-001', { failOnStatusCode: false });
      cy.url().should('include', '/403');
      cy.get('[data-testid="access-denied-message"]').should('be.visible');
    });

    it('should show territory restrictions in bulk operations', () => {
      // Create mixed dataset with some inaccessible leads
      cy.seedTestData('leads', 20);
      cy.reload();
      cy.waitForLeadsToLoad();

      // Attempt bulk selection
      cy.get('[data-testid="select-all-checkbox"]').check();

      // Should show partial access warning
      cy.get('[data-testid="bulk-actions-toolbar"]').should(
        'contain',
        'You can only perform actions on accessible leads'
      );

      cy.get('[data-testid="bulk-update-status-button"]').click();
      cy.get('[data-testid="accessible-leads-count"]').should('be.visible');
    });
  });

  describe('Timeline Functionality', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/leads');
    });

    it('should show timeline with latest 5 entries and lazy load older entries', () => {
      // Mock lead with extensive timeline
      const timelineItems = Array.from({ length: 20 }, (_, i) => ({
        id: `${i + 1}`,
        leadId: 'LEAD-001',
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        action: `Action ${i + 1}`,
        actor: 'user1',
        actorName: 'Test User',
        details: { remarks: `Timeline entry ${i + 1}` },
      }));

      cy.intercept('GET', '/api/v1/leads/LEAD-001/timeline*', req => {
        const url = new URL(req.url);
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '5');

        const paginatedItems = timelineItems.slice(offset, offset + limit);

        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              leadId: 'LEAD-001',
              timeline: paginatedItems,
              total: timelineItems.length,
            },
          },
        });
      }).as('getTimeline');

      // Open timeline
      cy.openLeadTimeline('LEAD-001');
      cy.wait('@getTimeline');

      // Should show initial 5 entries
      cy.get('[data-testid="timeline-item"]').should('have.length', 5);
      cy.get('[data-testid="timeline-item"]')
        .first()
        .should('contain', 'Action 1');

      // Load more entries
      cy.get('[data-testid="load-more-timeline-button"]').click();
      cy.wait('@getTimeline');
      cy.get('[data-testid="timeline-item"]').should('have.length', 10);

      // Check accessibility
      cy.checkA11yViolations();

      // Test keyboard navigation
      cy.get('[data-testid="timeline-drawer"]').focus();
      cy.focused().type('{esc}');
      cy.get('[data-testid="timeline-drawer"]').should('not.exist');
    });
  });

  describe('Performance and Lighthouse Tests', () => {
    it('should meet performance benchmarks', () => {
      cy.loginAsAdmin();

      // Run Lighthouse audit
      cy.lighthouse({
        performance: 90,
        accessibility: 95,
        'best-practices': 85,
        seo: 80,
      });

      // Measure specific metrics
      cy.visit('/leads');
      cy.measurePageLoad().then((metrics: any) => {
        expect(metrics.pageLoadTime).to.be.lessThan(2000);
        expect(metrics.domReadyTime).to.be.lessThan(1500);
        expect(metrics.serverResponseTime).to.be.lessThan(500);
      });

      // Test API response times
      cy.measureApiResponse('/api/v1/leads').then((response: any) => {
        expect(response.responseTime).to.be.lessThan(1000);
        expect(response.statusCode).to.equal(200);
      });
    });

    it('should handle concurrent user simulation', () => {
      // Simulate multiple users accessing the system
      const userSessions = ['admin', 'kam1', 'kam2'];

      userSessions.forEach((userType, index) => {
        cy.window().then(win => {
          win.open('/leads', `_blank_${index}`);
        });
      });

      // Primary session performance should not degrade
      cy.loginAsAdmin();
      cy.visit('/leads');
      cy.measurePageLoad().then((metrics: any) => {
        expect(metrics.pageLoadTime).to.be.lessThan(3000); // Slightly higher threshold for concurrent load
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
    });

    it('should handle network failures gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/v1/leads*', { forceNetworkError: true }).as(
        'networkError'
      );

      cy.visit('/leads');
      cy.wait('@networkError');

      // Should show error state
      cy.get('[data-testid="error-state"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');

      // Test retry functionality
      cy.intercept('GET', '/api/v1/leads*', {
        statusCode: 200,
        body: {
          success: true,
          data: { items: [], total: 0, page: 1, limit: 25, offset: 0 },
        },
      }).as('retrySuccess');

      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@retrySuccess');
      cy.get('[data-testid="leads-table"]').should('be.visible');
    });

    it('should handle server errors with appropriate messages', () => {
      cy.intercept('GET', '/api/v1/leads*', {
        statusCode: 500,
        body: { success: false, message: 'Internal server error' },
      }).as('serverError');

      cy.visit('/leads');
      cy.wait('@serverError');

      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Failed to load leads'
      );
      cy.get('[data-testid="error-details"]').should(
        'contain',
        'Please try again'
      );
    });

    it('should handle validation errors during lead creation', () => {
      cy.visit('/leads');

      // Attempt to create lead with invalid data
      cy.get('[data-testid="add-lead-fab"]').click();
      cy.get('[data-testid="customer-phone-input"]').type('invalid-phone');
      cy.get('[data-testid="create-lead-button"]').click();

      // Should show validation errors
      cy.get('[data-testid="phone-error"]').should(
        'contain',
        'Invalid phone number format'
      );
      cy.get('[data-testid="name-error"]').should(
        'contain',
        'Name is required'
      );

      // Fix errors and retry
      cy.get('[data-testid="customer-name-input"]').type('Valid Customer');
      cy.get('[data-testid="customer-phone-input"]').clear().type('9876543210');
      cy.get('[data-testid="create-lead-button"]').click();

      // Should succeed
      cy.get('[data-testid="toast-success"]').should('be.visible');
    });
  });

  describe('Accessibility Compliance', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/leads');
      cy.injectAxe();
    });

    it('should have no critical accessibility violations', () => {
      cy.waitForLeadsToLoad();

      // Check main page accessibility
      cy.checkA11yViolations({
        tags: ['wcag2a', 'wcag2aa'],
        includedImpacts: ['critical', 'serious'],
      });

      // Test with filters opened
      cy.get('[data-testid="filters-button"]').click();
      cy.checkA11yViolations();

      // Test status update dialog
      cy.get('[data-testid="lead-status-button"]').first().click();
      cy.checkA11yViolations();
    });

    it('should support keyboard navigation', () => {
      cy.waitForLeadsToLoad();

      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'add-lead-fab');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'filters-button');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'export-button');

      // Test arrow key navigation in table
      cy.get('[data-testid="leads-table"] tbody tr').first().focus();
      cy.focused().type('{downarrow}');
      cy.focused().should('have.attr', 'data-row-index', '1');
    });

    it('should have proper ARIA labels and screen reader support', () => {
      cy.waitForLeadsToLoad();

      // Check for essential ARIA attributes
      cy.get('[data-testid="leads-table"]').should(
        'have.attr',
        'aria-label',
        'Leads table'
      );
      cy.get('[data-testid="select-all-checkbox"]').should(
        'have.attr',
        'aria-label',
        'Select all leads'
      );
      cy.get('[data-testid="pagination"]').should(
        'have.attr',
        'aria-label',
        'Pagination navigation'
      );

      // Check for live regions
      cy.get('[aria-live="polite"]').should('exist');
      cy.get('[aria-live="assertive"]').should('exist');
    });
  });
});
