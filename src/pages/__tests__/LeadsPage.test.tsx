/**
 * Leads Page Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LeadsPage from '../leads/LeadsPage';
import { setupApiStore } from '../../test-utils';
import { leadEndpoints } from '../../api/endpoints/leadEndpoints';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { Lead } from '../../types/lead.types';

expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../hooks/useLeadAccess', () => ({
  useLeadAccess: () => ({
    isAdmin: true,
    isKAM: false,
  }),
}));

jest.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

jest.mock('../../hooks/useChannelPartners', () => ({
  useChannelPartners: () => ({
    channelPartners: [
      { id: 'CP-001', name: 'Partner 1', phone: '9876543210' },
      { id: 'CP-002', name: 'Partner 2', phone: '9876543211' },
    ],
    isLoading: false,
    error: null,
  }),
}));

const theme = createTheme();

const mockLeads: Lead[] = [
  {
    id: 'LEAD-001',
    leadId: 'LEAD-001',
    customerName: 'Test Customer 1',
    customerPhone: '9876543210',
    customerEmail: 'test1@example.com',
    address: 'Test Address 1',
    state: 'Maharashtra',
    pinCode: '400001',
    status: 'New Lead',
    origin: 'CP',
    createdBy: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'LEAD-002',
    leadId: 'LEAD-002',
    customerName: 'Test Customer 2',
    customerPhone: '9876543211',
    customerEmail: 'test2@example.com',
    address: 'Test Address 2',
    state: 'Gujarat',
    pinCode: '380001',
    status: 'In Discussion',
    origin: 'Customer',
    createdBy: 'user2',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
] as Lead[];

const renderWithProviders = () => {
  const { store } = setupApiStore(leadEndpoints, {
    leads: {
      list: {
        data: {
          leads: mockLeads,
          total: mockLeads.length,
          page: 1,
          limit: 10,
        },
        isLoading: false,
        error: null,
      },
    },
  });

  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <LeadsPage />
      </ThemeProvider>
    </Provider>
  );
};

describe('LeadsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page title and actions', () => {
    renderWithProviders();

    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should render lead grid with data', () => {
    renderWithProviders();

    expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
    expect(screen.getByText('Test Customer 2')).toBeInTheDocument();
  });

  it('should handle lead selection', () => {
    renderWithProviders();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(1); // Ensure we have checkboxes
    fireEvent.click(checkboxes[1] as HTMLElement);

    expect(screen.getByText(/1 lead selected/)).toBeInTheDocument();
  });

  it('should handle bulk status update', async () => {
    renderWithProviders();

    // Select leads
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(1); // Ensure we have checkboxes
    fireEvent.click(checkboxes[1] as HTMLElement);

    // Open bulk status dialog
    fireEvent.click(screen.getByText('Update Status'));

    // Dialog should be visible
    expect(screen.getByText('Bulk Status Update')).toBeInTheDocument();
  });

  it('should handle bulk reassign', async () => {
    renderWithProviders();

    // Select leads
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(1); // Ensure we have checkboxes
    fireEvent.click(checkboxes[1] as HTMLElement);

    // Open bulk reassign dialog
    fireEvent.click(screen.getByText('Reassign'));

    // Dialog should be visible
    expect(screen.getByText('Bulk Reassign Leads')).toBeInTheDocument();
  });

  it('should handle CSV import', async () => {
    renderWithProviders();

    // Open import dialog
    fireEvent.click(screen.getByText('Import'));

    // Dialog should be visible
    expect(screen.getByText('Import Leads from CSV')).toBeInTheDocument();
  });

  it('should handle CSV export', async () => {
    renderWithProviders();

    // Click export button
    fireEvent.click(screen.getByText('Export'));

    // Should trigger export
    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  it('should handle filter changes', async () => {
    renderWithProviders();

    // Open filter drawer
    fireEvent.click(screen.getByTestId('filter-button'));

    // Add a filter
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByText('New Lead'));

    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));

    // Should show active filters
    expect(screen.getByText(/Active Filters/)).toBeInTheDocument();
    expect(screen.getByText(/Status: New Lead/)).toBeInTheDocument();
  });

  it('should handle pagination', () => {
    renderWithProviders();

    // Change page size
    const pageSizeSelect = screen.getByLabelText('Rows per page');
    fireEvent.mouseDown(pageSizeSelect);
    fireEvent.click(screen.getByText('25'));

    expect(screen.getByText('1-2 of 2')).toBeInTheDocument();
  });

  it('should handle lead click', () => {
    renderWithProviders();

    fireEvent.click(screen.getByText('Test Customer 1'));

    // Should open lead details drawer
    expect(screen.getByText('Lead Details')).toBeInTheDocument();
  });

  it('should pass accessibility tests', async () => {
    const { container } = renderWithProviders();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should show error state', () => {
    const { store } = setupApiStore(leadEndpoints, {
      leads: {
        list: {
          data: null,
          isLoading: false,
          error: 'Failed to load leads',
        },
      },
    });

    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <LeadsPage />
        </ThemeProvider>
      </Provider>
    );

    expect(screen.getByText(/Error loading leads/)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const { store } = setupApiStore(leadEndpoints, {
      leads: {
        list: {
          data: null,
          isLoading: true,
          error: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <LeadsPage />
        </ThemeProvider>
      </Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    const { store } = setupApiStore(leadEndpoints, {
      leads: {
        list: {
          data: {
            leads: [],
            total: 0,
            page: 1,
            limit: 10,
          },
          isLoading: false,
          error: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <LeadsPage />
        </ThemeProvider>
      </Provider>
    );

    expect(screen.getByText(/No leads found/)).toBeInTheDocument();
  });
});
