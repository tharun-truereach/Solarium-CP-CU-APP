/**
 * Integration test for CSV Import in LeadsPage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LeadsPage from '../LeadsPage';
import { apiSlice } from '../../../api/apiSlice';

// Mock all dependencies
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
  }),
}));

jest.mock('../../../api/endpoints/leadEndpoints', () => ({
  useGetLeadsQuery: () => ({
    data: { data: { items: [], total: 0, offset: 0, limit: 25 } },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useImportLeadsMutation: () => [jest.fn(), { isLoading: false }],
}));

const theme = createTheme();
const store = configureStore({
  reducer: { api: apiSlice.reducer },
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

describe('LeadsPage CSV Import Integration', () => {
  it('should show Import CSV button for admin users', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Import CSV')).toBeInTheDocument();
    });
  });

  it('should open CSV import dialog when Import CSV clicked', async () => {
    renderWithProviders();

    const importButton = await screen.findByText('Import CSV');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText('Import Leads from CSV')).toBeInTheDocument();
    });
  });
});
