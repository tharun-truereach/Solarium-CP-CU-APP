/**
 * Mobile-specific E2E tests for Lead Management
 * Tests responsive behavior and mobile-specific interactions
 */

describe('Lead Management - Mobile Responsive Tests', () => {
  beforeEach(() => {
    cy.viewport('iphone-8');
    cy.loginAsAdmin();
    cy.visit('/leads');
  });

  it('should adapt table layout for mobile viewport', () => {
    cy.waitForLeadsToLoad();

    // Should hide non-essential columns on mobile
    cy.get('[data-testid="phone-column"]').should('not.be.visible');
    cy.get('[data-testid="territory-column"]').should('not.be.visible');
    cy.get('[data-testid="followup-column"]').should('not.be.visible');

    // Essential columns should remain visible
    cy.get('[data-testid="name-column"]').should('be.visible');
    cy.get('[data-testid="status-column"]').should('be.visible');
    cy.get('[data-testid="actions-column"]').should('be.visible');
  });

  it('should stack filters vertically on mobile', () => {
    cy.get('[data-testid="filters-button"]').click();

    // Filters should stack vertically
    cy.get('[data-testid="filters-container"]').should(
      'have.css',
      'flex-direction',
      'column'
    );

    // Filter inputs should be full width
    cy.get('[data-testid="search-input"]')
      .should('have.css', 'width')
      .and('match', /100%|[3-9][0-9][0-9]px/);
  });

  it('should use touch-friendly interactions', () => {
    cy.waitForLeadsToLoad();

    // FAB should be easily accessible
    cy.get('[data-testid="add-lead-fab"]')
      .should('be.visible')
      .should('have.css', 'min-height', '56px'); // Minimum touch target

    // Status buttons should be large enough for touch
    cy.get('[data-testid^="lead-"][data-testid$="-status"]')
      .first()
      .should('have.css', 'min-height', '44px'); // iOS minimum touch target
  });

  it('should handle mobile timeline drawer', () => {
    cy.waitForLeadsToLoad();
    cy.openLeadTimeline('LEAD-001');

    // Timeline drawer should be full screen on mobile
    cy.get('[data-testid="timeline-drawer"]')
      .should('have.css', 'width', '100vw')
      .should('have.css', 'height', '100vh');

    // Should support swipe to close (simulated)
    cy.get('[data-testid="timeline-drawer"]').trigger('touchstart', {
      touches: [{ clientX: 0, clientY: 100 }],
    });
    cy.get('[data-testid="timeline-drawer"]').trigger('touchmove', {
      touches: [{ clientX: 200, clientY: 100 }],
    });
    cy.get('[data-testid="timeline-drawer"]').trigger('touchend');
  });
});
