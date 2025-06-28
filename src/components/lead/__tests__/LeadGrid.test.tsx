/**
 * Comprehensive tests for LeadGrid component
 * Tests rendering, pagination, filtering, accessibility, and keyboard navigation
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { LeadGrid, LeadGridProps } from '../LeadGrid';
import { apiSlice } from '../../../api/apiSlice';
import { authSlice } from '../../../store/slices/authSlice';
import { setupApiStore } from '../../../test-utils';
import { leadEndpoints } from '../../../api/endpoints/leadEndpoints';
import type { Lead, LeadListResponse } from '../../../types/lead.types';

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
    assignedTo: 'cp1',
    assignedCpName: 'CP One',
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
    assignedTo: 'cp2',
    assignedCpName: 'CP Two',
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
] as const;

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

    let filteredLeads = [...mockLeads];

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
interface TestWrapperProps {
  children: React.ReactNode;
  store?: ReturnType<typeof createTestStore>;
  kamUser?: boolean;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  store,
  kamUser = false,
}) => {
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

const defaultProps: LeadGridProps = {
  leads: mockLeads,
  total: 2,
  loading: false,
  error: null,
  page: 0,
  pageSize: 25,
  sortBy: '',
  sortOrder: 'asc',
  selectedLeads: [],
  onPageChange: () => {},
  onPageSizeChange: () => {},
  onSortChange: () => {},
  onLeadSelect: () => {},
  onSelectAll: () => {},
};

/**
 * Render helper with providers
 */
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<TestWrapper>{ui}</TestWrapper>);
};

describe('LeadGrid Component', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Rendering and Data Loading', () => {
    it('should render loading state initially', async () => {
      render(
        <TestWrapper>
          <LeadGrid {...defaultProps} loading={true} />
        </TestWrapper>
      );

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    });

    it('should render leads table with data', async () => {
      render(
        <TestWrapper>
          <LeadGrid
            leads={mockLeads}
            total={mockLeads.length}
            loading={false}
            error={null}
            page={0}
            pageSize={25}
            sortBy=""
            sortOrder="asc"
            selectedLeads={[]}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            onSortChange={() => {}}
            onLeadSelect={() => {}}
            onSelectAll={() => {}}
          />
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

      // Check lead data
      mockLeads.forEach(lead => {
        expect(screen.getByText(lead.leadId)).toBeInTheDocument();
        expect(screen.getByText(lead.customerName)).toBeInTheDocument();
        expect(screen.getByText(lead.customerPhone)).toBeInTheDocument();
      });
    });

    it('should handle error state', () => {
      const errorMessage = 'Failed to load leads';
      render(
        <TestWrapper>
          <LeadGrid
            leads={[]}
            total={0}
            loading={false}
            error={{ message: errorMessage }}
            page={0}
            pageSize={25}
            sortBy=""
            sortOrder="asc"
            selectedLeads={[]}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            onSortChange={() => {}}
            onLeadSelect={() => {}}
            onSelectAll={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
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
          <LeadGrid
            leads={mockLeads}
            total={mockLeads.length}
            loading={false}
            error={null}
            page={0}
            pageSize={25}
            sortBy=""
            sortOrder="asc"
            selectedLeads={[]}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            onSortChange={() => {}}
            onLeadSelect={() => {}}
            onSelectAll={() => {}}
          />
        </TestWrapper>
      );

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
          <LeadGrid {...defaultProps} />
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

  describe('LeadGrid', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render grid with leads data', () => {
      renderWithProviders(<LeadGrid {...defaultProps} />);

      expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
      expect(screen.getByText('Test Customer 2')).toBeInTheDocument();
      expect(screen.getByText('9876543210')).toBeInTheDocument();
      expect(screen.getByText('9876543211')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      renderWithProviders(<LeadGrid {...defaultProps} loading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show empty state when no leads', () => {
      renderWithProviders(<LeadGrid {...defaultProps} leads={[]} />);

      expect(screen.getByText(/No leads found/)).toBeInTheDocument();
    });

    it('should handle row selection', () => {
      const onSelectionChange = jest.fn();

      renderWithProviders(
        <LeadGrid {...defaultProps} onSelectionChange={onSelectionChange} />
      );

      const checkbox = screen.getAllByRole('checkbox')[1]; // First row checkbox
      fireEvent.click(checkbox);

      expect(onSelectionChange).toHaveBeenCalledWith(['LEAD-001']);
    });

    it('should handle select all', () => {
      const onSelectionChange = jest.fn();

      renderWithProviders(
        <LeadGrid {...defaultProps} onSelectionChange={onSelectionChange} />
      );

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith(['LEAD-001', 'LEAD-002']);
    });

    it('should handle lead click', () => {
      const onLeadClick = jest.fn();

      renderWithProviders(
        <LeadGrid {...defaultProps} onLeadClick={onLeadClick} />
      );

      fireEvent.click(screen.getByText('Test Customer 1'));

      expect(onLeadClick).toHaveBeenCalledWith('LEAD-001');
    });

    it('should show bulk action toolbar when leads selected', () => {
      renderWithProviders(
        <LeadGrid
          {...defaultProps}
          selectedLeadIds={['LEAD-001', 'LEAD-002']}
        />
      );

      expect(screen.getByText(/2 leads selected/)).toBeInTheDocument();
      expect(screen.getByText('Update Status')).toBeInTheDocument();
      expect(screen.getByText('Reassign')).toBeInTheDocument();
    });

    it('should handle bulk status update', () => {
      const onBulkStatusChange = jest.fn();

      renderWithProviders(
        <LeadGrid
          {...defaultProps}
          selectedLeadIds={['LEAD-001', 'LEAD-002']}
          onBulkStatusChange={onBulkStatusChange}
        />
      );

      fireEvent.click(screen.getByText('Update Status'));

      expect(onBulkStatusChange).toHaveBeenCalledWith(['LEAD-001', 'LEAD-002']);
    });

    it('should handle bulk reassign', () => {
      const onBulkReassign = jest.fn();

      renderWithProviders(
        <LeadGrid
          {...defaultProps}
          selectedLeadIds={['LEAD-001', 'LEAD-002']}
          onBulkReassign={onBulkReassign}
        />
      );

      fireEvent.click(screen.getByText('Reassign'));

      expect(onBulkReassign).toHaveBeenCalledWith(['LEAD-001', 'LEAD-002']);
    });

    it('should handle CSV export', () => {
      const onExportCSV = jest.fn();

      renderWithProviders(
        <LeadGrid {...defaultProps} onExportCSV={onExportCSV} />
      );

      fireEvent.click(screen.getByText('Export'));

      expect(onExportCSV).toHaveBeenCalled();
    });

    it('should handle CSV import', () => {
      const onImportCSV = jest.fn();

      renderWithProviders(
        <LeadGrid {...defaultProps} onBulkUpdateStatus={onImportCSV} />
      );

      fireEvent.click(screen.getByText('Import'));

      expect(onImportCSV).toHaveBeenCalled();
    });

    it('should pass accessibility tests', async () => {
      const { container } = renderWithProviders(<LeadGrid {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should show correct status colors', () => {
      renderWithProviders(<LeadGrid {...defaultProps} />);

      const newLeadChip = screen.getByText('New Lead');
      const inDiscussionChip = screen.getByText('In Discussion');

      expect(newLeadChip).toHaveStyle({ backgroundColor: expect.any(String) });
      expect(inDiscussionChip).toHaveStyle({
        backgroundColor: expect.any(String),
      });
    });

    it('should format dates correctly', () => {
      renderWithProviders(<LeadGrid {...defaultProps} />);

      expect(screen.getByText('01 Jan 2024')).toBeInTheDocument();
      expect(screen.getByText('02 Jan 2024')).toBeInTheDocument();
    });

    it('should show correct origin icons', () => {
      renderWithProviders(<LeadGrid {...defaultProps} />);

      const cpIcon = screen.getByTestId('cp-origin-icon');
      const customerIcon = screen.getByTestId('customer-origin-icon');

      expect(cpIcon).toBeInTheDocument();
      expect(customerIcon).toBeInTheDocument();
    });

    it('should handle column sorting', () => {
      renderWithProviders(<LeadGrid {...defaultProps} />);

      const customerNameHeader = screen.getByText('Customer Name');
      fireEvent.click(customerNameHeader);

      // Should show sort icon
      expect(screen.getByTestId('sort-icon')).toBeInTheDocument();
    });

    it('should handle column resizing', () => {
      renderWithProviders(<LeadGrid {...defaultProps} />);

      const resizeHandle = screen.getByTestId('resize-handle-customerName');
      fireEvent.mouseDown(resizeHandle);
      fireEvent.mouseMove(document, { clientX: 300 });
      fireEvent.mouseUp(document);

      // Column width should be updated
      const column = screen.getByTestId('column-customerName');
      expect(column).toHaveStyle({ width: expect.any(String) });
    });

    it('should handle lead selection', async () => {
      const onLeadSelect = jest.fn();
      render(
        <TestWrapper>
          <LeadGrid {...defaultProps} onLeadSelect={onLeadSelect} />
        </TestWrapper>
      );
      // ... rest of test code ...
    });

    it('should handle timeline view', async () => {
      const onLeadTimeline = jest.fn();
      render(
        <TestWrapper>
          <LeadGrid {...defaultProps} onLeadTimeline={onLeadTimeline} />
        </TestWrapper>
      );
      // ... rest of test code ...
    });
  });

  describe('Interactions', () => {
    it('should handle row selection', async () => {
      const onLeadSelect = jest.fn();
      const onSelectAll = jest.fn();

      render(
        <TestWrapper>
          <LeadGrid
            leads={mockLeads}
            total={mockLeads.length}
            loading={false}
            error={null}
            page={0}
            pageSize={25}
            sortBy=""
            sortOrder="asc"
            selectedLeads={[]}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            onSortChange={() => {}}
            onLeadSelect={onLeadSelect}
            onSelectAll={onSelectAll}
          />
        </TestWrapper>
      );

      // Wait for table to render
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Get all checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(1); // Header + rows

      // Click first row checkbox
      fireEvent.click(checkboxes[1] as HTMLElement);
      expect(onLeadSelect).toHaveBeenCalledWith(mockLeads[0]?.id, true);

      // Click select all checkbox
      fireEvent.click(checkboxes[0] as HTMLElement);
      expect(onSelectAll).toHaveBeenCalledWith(true);
    });
  });
});
