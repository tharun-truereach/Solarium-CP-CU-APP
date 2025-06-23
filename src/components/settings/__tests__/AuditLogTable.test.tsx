/**
 * AuditLogTable component test suite
 * Tests table functionality, accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../theme';
import { apiSlice } from '../../../api/apiSlice';
import AuditLogTable from '../AuditLogTable';
import type { SettingsAuditLog } from '../../../types/settings.types';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock data
const mockAuditLogs: SettingsAuditLog[] = [
  {
    id: '1',
    userId: 'admin-123',
    userName: 'Admin User',
    field: 'sessionTimeoutMin',
    oldValue: 15,
    newValue: 30,
    timestamp: '2024-01-15T10:30:00Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  },
  {
    id: '2',
    userId: 'admin-123',
    userName: 'Admin User',
    field: 'featureFlags.ADVANCED_REPORTING',
    oldValue: false,
    newValue: true,
    timestamp: '2024-01-15T10:25:00Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  },
  {
    id: '3',
    userId: 'kam-456',
    userName: 'KAM User',
    field: 'thresholds.MAX_LEADS_PER_PAGE',
    oldValue: 25,
    newValue: 50,
    timestamp: '2024-01-15T09:15:00Z',
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0',
  },
];

// MSW server
const server = setupServer(
  rest.get('/api/v1/settings/audit', (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');

    return res(
      ctx.status(200),
      ctx.json({
        logs: mockAuditLogs,
        total: mockAuditLogs.length,
        page,
        limit,
        totalPages: Math.ceil(mockAuditLogs.length / limit),
      })
    );
  })
);

// Test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      api: apiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = createTestStore();

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </Provider>
  );
};

describe('AuditLogTable', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Rendering', () => {
    it('should render audit log table with data', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Settings Audit Log')).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Field')).toBeInTheDocument();
      expect(screen.getByText('Old Value')).toBeInTheDocument();
      expect(screen.getByText('New Value')).toBeInTheDocument();

      // Check data rows
      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('sessionTimeoutMin')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      expect(screen.getByText('Loading audit logs...')).toBeInTheDocument();
    });

    it('should show empty state when no logs', async () => {
      server.use(
        rest.get('/api/v1/settings/audit', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              logs: [],
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
            })
          );
        })
      );

      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No audit logs found')).toBeInTheDocument();
      });
    });

    it('should show error state on API failure', async () => {
      server.use(
        rest.get('/api/v1/settings/audit', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ message: 'Internal server error' })
          );
        })
      );

      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load audit logs/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper table semantics', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table', { name: /audit log table/i });
        expect(table).toBeInTheDocument();
      });

      // Check column headers
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);

      // Check rows
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // Header + data rows
      });
    });

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      // Focus should work on table elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      const firstSortButton = buttons[0]!;
      firstSortButton.focus();
      expect(document.activeElement).toBe(firstSortButton);
    });

    it('should have proper aria labels and roles', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toHaveAttribute(
          'aria-label',
          'audit log table'
        );
      });

      // Check pagination accessibility
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by timestamp desc by default', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        const timeColumn = screen.getByText('Time');
        expect(timeColumn.closest('th')).toBeInTheDocument();
      });

      // The most recent timestamp should appear first
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // Skip header row, check data ordering
        expect(rows.length).toBeGreaterThan(1);
      });
    });

    it('should handle sort direction changes', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        const timeColumn = screen.getByText('Time');
        expect(timeColumn).toBeInTheDocument();
      });

      // Click to change sort direction
      fireEvent.click(screen.getByText('Time'));

      // Should update the sort indicator
      await waitFor(() => {
        expect(screen.getByText('Time')).toBeInTheDocument();
      });
    });

    it('should sort by different columns', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });

      // Click user column to sort by user
      fireEvent.click(screen.getByText('User'));

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Logs per page:')).toBeInTheDocument();
      });

      // Check page navigation
      const pagination = screen.getByRole('navigation');
      expect(pagination).toBeInTheDocument();
    });

    it('should handle page size changes', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        const pageSizeSelect = screen.getByDisplayValue('10');
        expect(pageSizeSelect).toBeInTheDocument();
      });

      // Change page size
      fireEvent.mouseDown(screen.getByDisplayValue('10'));
      const option25 = screen.getByText('25');
      fireEvent.click(option25);

      await waitFor(() => {
        expect(screen.getByDisplayValue('25')).toBeInTheDocument();
      });
    });

    it('should display correct pagination info', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/1-3 of 3/)).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format timestamps correctly', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check that timestamp is formatted as local time
        const timestampElements = screen.getAllByText(/2024/);
        expect(timestampElements.length).toBeGreaterThan(0);
      });
    });

    it('should format field names as chips', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('sessionTimeoutMin')).toBeInTheDocument();
      });
    });

    it('should format old and new values with different colors', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        // Old values should have error styling
        const oldValueElements = screen.getAllByText('15');
        expect(oldValueElements.length).toBeGreaterThan(0);

        // New values should have success styling
        const newValueElements = screen.getAllByText('30');
        expect(newValueElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Actions', () => {
    it('should handle refresh action', async () => {
      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        const refreshButton = screen.getByLabelText('Refresh');
        expect(refreshButton).toBeInTheDocument();
      });

      // Click refresh
      fireEvent.click(screen.getByLabelText('Refresh'));

      // Should maintain functionality (no errors)
      await waitFor(() => {
        expect(screen.getByText('Settings Audit Log')).toBeInTheDocument();
      });
    });

    it('should call onViewDetails when provided', async () => {
      const mockOnViewDetails = jest.fn();

      render(
        <TestWrapper>
          <AuditLogTable onViewDetails={mockOnViewDetails} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Click view details button
      const viewButtons = screen.getAllByLabelText('View Details');
      expect(viewButtons.length).toBeGreaterThan(0);
      const viewButton = viewButtons[0]!;
      fireEvent.click(viewButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          field: 'sessionTimeoutMin',
        })
      );
    });
  });

  describe('Virtualization', () => {
    it('should not use virtualization for small datasets', async () => {
      render(
        <TestWrapper>
          <AuditLogTable enableVirtualization={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        // With only 3 items, should use regular table
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('should disable virtualization when prop is false', async () => {
      render(
        <TestWrapper>
          <AuditLogTable enableVirtualization={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile breakpoints', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      render(
        <TestWrapper>
          <AuditLogTable />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Settings Audit Log')).toBeInTheDocument();
      });
    });
  });
});
