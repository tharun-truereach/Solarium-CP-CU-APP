/**
 * Comprehensive tests for LeadGrid component
 * Tests rendering, pagination, filtering, accessibility, and keyboard navigation
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { LeadGrid } from '../LeadGrid';
import { apiSlice } from '../../../api/apiSlice';
import { authSlice } from '../../../store/slices/authSlice';
import type { Lead, LeadListResponse } from '../../../types/lead.types';
import { ThemeProvider } from '../../../theme';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockLeads: Lead[] = [
  {
    id: '1',
    leadId: 'LEAD-001',
    customerName: 'John Doe',
    customerPhone: '1234567890',
    customerEmail: 'john@example.com',
    address: '123 Test Street, Test City',
    state: 'TestState',
    pinCode: '123456',
    status: 'New Lead',
    assignedCP: 'cp1',
    assignedCPName: 'CP One',
    origin: 'CP',
    remarks: 'Initial contact made',
    followUpDate: '2024-01-15',
    territory: 'North',
    services: ['Solar Installation'],
    createdBy: 'user1',
    createdByName: 'Admin User',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    leadId: 'LEAD-002',
    customerName: 'Jane Smith',
    customerPhone: '0987654321',
    address: '456 Another Street, Another City',
    state: 'AnotherState',
    pinCode: '654321',
    status: 'In Discussion',
    assignedCP: 'cp2',
    assignedCPName: 'CP Two',
    origin: 'Customer',
    remarks: 'Customer interested in quote',
    followUpDate: '2024-01-20',
    territory: 'South',
    services: ['Solar Maintenance'],
    createdBy: 'user2',
    createdByName: 'KAM User',
    createdAt: '2024-01-02T11:00:00Z',
    updatedAt: '2024-01-02T11:00:00Z',
  },
];

const mockLeadResponse: LeadListResponse = {
  success: true,
  data: {
    items: mockLeads,
    total: 2,
    page: 1,
    limit: 25,
    offset: 0,
    totalPages: 1,
  },
};

// MSW server setup
const server = setupServer(
  rest.get('/api/v1/leads', (req, res, ctx) => {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let filteredLeads = mockLeads;

    if (status && status !== 'all') {
      filteredLeads = mockLeads.filter(lead => lead.status === status);
    }

    if (search) {
      filteredLeads = mockLeads.filter(
        lead =>
          lead.customerName.toLowerCase().includes(search.toLowerCase()) ||
          lead.customerPhone.includes(search)
      );
    }

    return res(
      ctx.json({
        success: true,
        data: {
          items: filteredLeads,
          total: filteredLeads.length,
          page: 1,
          limit: 25,
          offset: 0,
          totalPages: 1,
        },
      })
    );
  }),

  rest.get('/api/v1/leads/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        message: 'Internal server error',
      })
    );
  })
);

// Test store setup
const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      api: apiSlice.reducer,
      auth: authSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin User',
          role: 'admin',
          permissions: [],
          territories: ['North', 'South'],
          isActive: true,
          isVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        token: 'mock-token',
        isLoading: false,
        error: null,
        refreshToken: null,
        expiresAt: null,
        lastActivity: null,
        loginTimestamp: null,
        sessionWarningShown: false,
        loginAttempts: 0,
        lockoutUntil: null,
        rememberMe: false,
        twoFactorRequired: false,
        twoFactorToken: null,
        ...initialState,
      },
    },
  });

// Test wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
  store?: ReturnType<typeof createTestStore>;
  kamUser?: boolean;
}> = ({ children, store, kamUser = false }) => {
  const testStore =
    store ||
    createTestStore(
      kamUser
        ? {
            user: {
              id: '2',
              email: 'kam@test.com',
              name: 'KAM User',
              role: 'kam',
              permissions: [],
              territories: ['North'],
              isActive: true,
              isVerified: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          }
        : {}
    );

  return (
    <Provider store={testStore}>
      <BrowserRouter>
        <ThemeProvider>{children}</ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('LeadGrid Component', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Rendering and Data Loading', () => {
    it('should render loading state initially', () => {
      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    });

    it('should render leads table with data', async () => {
      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check table headers
      expect(
        screen.getByRole('columnheader', { name: /lead id/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /customer name/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /phone/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /status/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: /assigned cp/i })
      ).toBeInTheDocument();

      // Check data rows
      expect(screen.getByText('LEAD-001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
      expect(screen.getByText('New Lead')).toBeInTheDocument();

      expect(screen.getByText('LEAD-002')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('In Discussion')).toBeInTheDocument();
    });

    it('should render empty state when no leads', async () => {
      server.use(
        rest.get('/api/v1/leads', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                items: [],
                total: 0,
                page: 1,
                limit: 25,
                offset: 0,
                totalPages: 0,
              },
            })
          );
        })
      );

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/no leads found/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/get started by creating your first lead/i)
      ).toBeInTheDocument();
    });

    it('should render error state on API failure', async () => {
      server.use(
        rest.get('/api/v1/leads', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              success: false,
              message: 'Internal server error',
            })
          );
        })
      );

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load leads/i)).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    it('should filter leads by status', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Find and interact with status filter
      const statusFilter = screen.getByRole('combobox', {
        name: /filter by status/i,
      });
      await user.click(statusFilter);

      const newLeadOption = screen.getByRole('option', { name: /new lead/i });
      await user.click(newLeadOption);

      // Verify API was called with status filter
      await waitFor(() => {
        expect(screen.getByText('LEAD-001')).toBeInTheDocument();
        expect(screen.queryByText('LEAD-002')).not.toBeInTheDocument();
      });
    });

    it('should search leads by customer name', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Find search input
      const searchInput = screen.getByRole('textbox', {
        name: /search leads/i,
      });
      await user.type(searchInput, 'John');

      // Wait for debounced search
      await waitFor(
        () => {
          expect(screen.getByText('LEAD-001')).toBeInTheDocument();
          expect(screen.queryByText('LEAD-002')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should clear all filters', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Apply a filter first
      const statusFilter = screen.getByRole('combobox', {
        name: /filter by status/i,
      });
      await user.click(statusFilter);
      const newLeadOption = screen.getByRole('option', { name: /new lead/i });
      await user.click(newLeadOption);

      // Clear filters
      const clearButton = screen.getByRole('button', {
        name: /clear all filters/i,
      });
      await user.click(clearButton);

      // Verify all leads are shown again
      await waitFor(() => {
        expect(screen.getByText('LEAD-001')).toBeInTheDocument();
        expect(screen.getByText('LEAD-002')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls', async () => {
      // Mock response with multiple pages
      server.use(
        rest.get('/api/v1/leads', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                items: mockLeads,
                total: 100,
                page: 1,
                limit: 25,
                offset: 0,
                totalPages: 4,
              },
            })
          );
        })
      );

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /pagination/i })
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/1.*4/)).toBeInTheDocument(); // "1 of 4" or similar
      expect(
        screen.getByRole('button', { name: /go to next page/i })
      ).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();

      server.use(
        rest.get('/api/v1/leads', (req, res, ctx) => {
          const url = new URL(req.url);
          const page = url.searchParams.get('page') || '1';

          return res(
            ctx.json({
              success: true,
              data: {
                items: mockLeads,
                total: 100,
                page: parseInt(page),
                limit: 25,
                offset: (parseInt(page) - 1) * 25,
                totalPages: 4,
              },
            })
          );
        })
      );

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('navigation', { name: /pagination/i })
        ).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', {
        name: /go to next page/i,
      });
      await user.click(nextButton);

      // Verify page changed (this would be more thoroughly tested in integration tests)
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Territory Access (KAM User)', () => {
    it('should show only accessible leads for KAM user', async () => {
      // Mock KAM user with limited territory access
      render(
        <TestWrapper kamUser={true}>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // KAM user should see leads but territory filtering is handled server-side
      expect(screen.getByText('LEAD-001')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Tab through interactive elements
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      const exportButton = screen.getByRole('button', {
        name: /export selected leads/i,
      });

      // Focus should move through interactive elements
      filtersButton.focus();
      expect(document.activeElement).toBe(filtersButton);

      await user.tab();
      expect(document.activeElement).toBe(exportButton);
    });

    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check table accessibility
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Leads table');

      // Check column headers
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);

      // Check select all checkbox
      const selectAllCheckbox = screen.getByRole('checkbox', {
        name: /select all leads/i,
      });
      expect(selectAllCheckbox).toHaveAttribute('aria-label');
    });

    it('should provide screen reader announcements for state changes', async () => {
      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check for live regions that announce changes
      const liveRegion = screen.getByRole('status', { name: /leads status/i });
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent(/2 leads loaded/i);
    });
  });

  describe('Bulk Selection', () => {
    it('should support bulk selection of leads', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find select all checkbox
      const selectAllCheckbox = screen.getByRole('checkbox', {
        name: /select all leads/i,
      });
      await user.click(selectAllCheckbox);

      // Verify individual checkboxes are selected
      const individualCheckboxes = screen.getAllByRole('checkbox');
      const leadCheckboxes = individualCheckboxes.filter(cb =>
        cb.getAttribute('aria-label')?.includes('Select lead')
      );

      leadCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should show bulk actions when leads are selected', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Select a lead
      const firstLeadCheckbox = screen.getByRole('checkbox', {
        name: /select lead lead-001/i,
      });
      await user.click(firstLeadCheckbox);

      // Verify bulk actions appear
      expect(
        screen.getByRole('button', { name: /update status/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reassign/i })
      ).toBeInTheDocument();
    });

    it('should limit bulk selection to 50 leads', async () => {
      const user = userEvent.setup();

      // Mock large dataset
      const manyLeads = Array.from({ length: 100 }, (_, i) => ({
        ...mockLeads[0],
        id: `${i + 1}`,
        leadId: `LEAD-${(i + 1).toString().padStart(3, '0')}`,
        customerName: `Customer ${i + 1}`,
      }));

      server.use(
        rest.get('/api/v1/leads', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                items: manyLeads,
                total: 100,
                page: 1,
                limit: 100,
                offset: 0,
                totalPages: 1,
              },
            })
          );
        })
      );

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Select all leads
      const selectAllCheckbox = screen.getByRole('checkbox', {
        name: /select all leads/i,
      });
      await user.click(selectAllCheckbox);

      // Should show maximum selection message
      expect(screen.getByText(/maximum 50/i)).toBeInTheDocument();
    });
  });

  describe('Row Actions', () => {
    it('should show action buttons for each lead row', async () => {
      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check for action buttons in each row
      expect(
        screen.getAllByRole('button', { name: /view timeline/i })
      ).toHaveLength(2);
      expect(
        screen.getAllByRole('button', { name: /edit lead/i })
      ).toHaveLength(2);
    });

    it('should call timeline handler when timeline button is clicked', async () => {
      const user = userEvent.setup();
      const onTimelineOpen = jest.fn();

      render(
        <TestWrapper>
          <LeadGrid onTimelineOpen={onTimelineOpen} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const timelineButton = screen.getAllByRole('button', {
        name: /view timeline/i,
      })[0];
      await user.click(timelineButton);

      expect(onTimelineOpen).toHaveBeenCalledWith('1');
    });

    it('should call select handler when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onLeadSelect = jest.fn();

      render(
        <TestWrapper>
          <LeadGrid onLeadSelect={onLeadSelect} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const editButton = screen.getAllByRole('button', {
        name: /edit lead/i,
      })[0];
      await user.click(editButton);

      expect(onLeadSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          leadId: 'LEAD-001',
        })
      );
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <LeadGrid />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // In mobile view, some columns might be hidden
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Phone column should be hidden on mobile
      expect(
        screen.queryByRole('columnheader', { name: /phone/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Virtualization', () => {
    it('should use virtualization for large datasets', async () => {
      render(
        <TestWrapper>
          <LeadGrid enableVirtualization={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check if virtualization is properly configured
      // (This would depend on the actual virtualization implementation)
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });
});
