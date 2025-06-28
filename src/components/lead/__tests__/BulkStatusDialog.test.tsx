/**
 * Bulk Status Dialog Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BulkStatusDialog } from '../BulkStatusDialog';
import { setupApiStore } from '../../../test-utils';
import { leadEndpoints } from '../../../api/endpoints/leadEndpoints';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

const theme = createTheme();

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  selectedLeadIds: ['LEAD-001', 'LEAD-002'],
  onSuccess: jest.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  const { store } = setupApiStore(leadEndpoints);

  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {ui}
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
};

describe('BulkStatusDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with correct title and lead count', () => {
    renderWithProviders(<BulkStatusDialog {...defaultProps} />);

    expect(screen.getByText('Bulk Status Update')).toBeInTheDocument();
    expect(
      screen.getByText(/Update status for 2 selected leads/)
    ).toBeInTheDocument();
  });

  it('should show warning for over 50 leads', () => {
    const manyLeads = Array.from({ length: 51 }, (_, i) => `LEAD-${i}`);

    renderWithProviders(
      <BulkStatusDialog {...defaultProps} selectedLeadIds={manyLeads} />
    );

    expect(screen.getByText(/You have selected 51 leads/)).toBeInTheDocument();
    expect(
      screen.getByText(/bulk operations are limited to 50/)
    ).toBeInTheDocument();
  });

  it('should disable submit button when over 50 leads', () => {
    const manyLeads = Array.from({ length: 51 }, (_, i) => `LEAD-${i}`);

    renderWithProviders(
      <BulkStatusDialog {...defaultProps} selectedLeadIds={manyLeads} />
    );

    const submitButton = screen.getByText(/Update \d+ Leads/);
    expect(submitButton).toBeDisabled();
  });

  it('should show quotation reference field when Won status selected', async () => {
    renderWithProviders(<BulkStatusDialog {...defaultProps} />);

    const statusSelect = screen.getByLabelText('New Status');
    fireEvent.mouseDown(statusSelect);

    const wonOption = screen.getByText('Won');
    fireEvent.click(wonOption);

    await waitFor(() => {
      expect(screen.getByLabelText('Quotation Reference')).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    renderWithProviders(<BulkStatusDialog {...defaultProps} />);

    const submitButton = screen.getByText(/Update \d+ Leads/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Status is required')).toBeInTheDocument();
    });
  });

  it('should validate remarks minimum length', async () => {
    renderWithProviders(<BulkStatusDialog {...defaultProps} />);

    const remarksField = screen.getByLabelText('Remarks');
    fireEvent.change(remarksField, { target: { value: 'short' } });
    fireEvent.blur(remarksField);

    await waitFor(() => {
      expect(
        screen.getByText(/Remarks must be at least 10 characters/)
      ).toBeInTheDocument();
    });
  });

  it('should call onClose when cancel clicked', () => {
    const onClose = jest.fn();

    renderWithProviders(
      <BulkStatusDialog {...defaultProps} onClose={onClose} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should pass accessibility tests', async () => {
    const { container } = renderWithProviders(
      <BulkStatusDialog {...defaultProps} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle form submission correctly', async () => {
    renderWithProviders(<BulkStatusDialog {...defaultProps} />);

    // Fill form
    const statusSelect = screen.getByLabelText('New Status');
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByText('In Discussion'));

    const remarksField = screen.getByLabelText('Remarks');
    fireEvent.change(remarksField, {
      target: { value: 'Test bulk update remarks' },
    });

    // Submit form
    const submitButton = screen.getByText(/Update \d+ Leads/);
    fireEvent.click(submitButton);

    // Should be in loading state
    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });
  });
});
