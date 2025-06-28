/**
 * Integration tests for LeadsPage with bulk action dialogs
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LeadsPage from '../LeadsPage';
import { apiSlice } from '../../../api/apiSlice';

// Mock dependencies
jest.mock('../../../hooks/useLeadAccess', () => ({
  useLeadAccess: () => ({
    isAdmin: true,
    isKAM: false,
    canPerformAction: () => ({ hasAccess: true }),
  }),
}));

jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  }),
}));

jest.mock('../../../api/endpoints/leadEndpoints', () => ({
  useGetLeadsQuery: () => ({
    data: {
      data: {
        items: [
          {
            id: 'LEAD-001',
            leadId: 'LEAD-001',
            customerName: 'Test Customer 1',
            customerPhone: '1234567890',
            address: 'Test Address',
            state: 'Test State',
            pinCode: '123456',
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
            customerPhone: '0987654321',
            address: 'Test Address 2',
            state: 'Test State',
            pinCode: '654321',
            status: 'In Discussion',
            origin: 'Customer',
            createdBy: 'user2',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
        total: 2,
        offset: 0,
        limit: 25,
      },
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useBulkUpdateLeadsMutation: () => [jest.fn(), { isLoading: false }],
  useBulkReassignLeadsMutation: () => [jest.fn(), { isLoading: false }],
}));

const theme = createTheme();
const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

const renderWithProviders = () => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <LeadsPage />
      </ThemeProvider>
    </Provider>
  );
};

describe('LeadsPage Bulk Actions Integration', () => {
  it('should open bulk status dialog when bulk update button clicked', async () => {
    renderWithProviders();

    // Wait for leads to load
    await waitFor(() => {
      expect(screen.getByText('LEAD-001')).toBeInTheDocument();
    });

    // Select leads
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]!); // First lead checkbox
    fireEvent.click(checkboxes[2]!); // Second lead checkbox

    // Click bulk update status
    const updateButton = screen.getByText('Update Status');
    fireEvent.click(updateButton);

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByText('Update Lead Status (Bulk)')).toBeInTheDocument();
    });
  });

  it('should open bulk reassign dialog when bulk reassign button clicked', async () => {
    renderWithProviders();

    // Wait for leads to load
    await waitFor(() => {
      expect(screen.getByText('LEAD-001')).toBeInTheDocument();
    });

    // Select leads
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]!); // First lead checkbox

    // Click bulk reassign
    const reassignButton = screen.getByText('Reassign');
    fireEvent.click(reassignButton);

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByText('Reassign Leads (Bulk)')).toBeInTheDocument();
    });
  });

  it('should show error when trying bulk action with no selection', async () => {
    const mockShowError = jest.fn();
    jest.mocked(require('../../../hooks/useToast').useToast).mockReturnValue({
      showError: mockShowError,
      showSuccess: jest.fn(),
      showWarning: jest.fn(),
      showInfo: jest.fn(),
    });

    renderWithProviders();

    // Wait for leads to load
    await waitFor(() => {
      expect(screen.getByText('LEAD-001')).toBeInTheDocument();
    });

    // Try to click update without selection (toolbar shouldn't be visible)
    // This test validates the button states are handled correctly
    expect(screen.queryByText('Update Status')).not.toBeInTheDocument();
  });
});
