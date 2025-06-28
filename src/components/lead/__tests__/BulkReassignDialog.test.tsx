/**
 * Bulk Reassign Dialog Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BulkReassignDialog } from '../BulkReassignDialog';
import { setupApiStore } from '../../../test-utils';
import { leadEndpoints } from '../../../api/endpoints/leadEndpoints';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../../hooks/useChannelPartners', () => ({
  useChannelPartners: () => ({
    channelPartners: [
      { id: 'CP-001', name: 'Partner 1', phone: '9876543210' },
      { id: 'CP-002', name: 'Partner 2', phone: '9876543211' },
    ],
    isLoading: false,
    error: null,
  }),
}));

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
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </Provider>
  );
};

describe('BulkReassignDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with correct title and lead count', () => {
    renderWithProviders(<BulkReassignDialog {...defaultProps} />);

    expect(screen.getByText('Bulk Reassign Leads')).toBeInTheDocument();
    expect(screen.getByText(/Reassign 2 selected leads/)).toBeInTheDocument();
  });

  it('should show warning for over 50 leads', () => {
    const manyLeads = Array.from({ length: 51 }, (_, i) => `LEAD-${i}`);

    renderWithProviders(
      <BulkReassignDialog {...defaultProps} selectedLeadIds={manyLeads} />
    );

    expect(screen.getByText(/You have selected 51 leads/)).toBeInTheDocument();
    expect(
      screen.getByText(/bulk operations are limited to 50/)
    ).toBeInTheDocument();
  });

  it('should disable submit button when over 50 leads', () => {
    const manyLeads = Array.from({ length: 51 }, (_, i) => `LEAD-${i}`);

    renderWithProviders(
      <BulkReassignDialog {...defaultProps} selectedLeadIds={manyLeads} />
    );

    const submitButton = screen.getByText(/Reassign \d+ Leads/);
    expect(submitButton).toBeDisabled();
  });

  it('should show channel partner list', () => {
    renderWithProviders(<BulkReassignDialog {...defaultProps} />);

    expect(screen.getByText('Partner 1')).toBeInTheDocument();
    expect(screen.getByText('Partner 2')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderWithProviders(<BulkReassignDialog {...defaultProps} />);

    const submitButton = screen.getByText(/Reassign \d+ Leads/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Channel Partner is required')
      ).toBeInTheDocument();
      expect(screen.getByText('Remarks is required')).toBeInTheDocument();
    });
  });

  it('should validate remarks minimum length', async () => {
    renderWithProviders(<BulkReassignDialog {...defaultProps} />);

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
      <BulkReassignDialog {...defaultProps} onClose={onClose} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should pass accessibility tests', async () => {
    const { container } = renderWithProviders(
      <BulkReassignDialog {...defaultProps} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle form submission correctly', async () => {
    renderWithProviders(<BulkReassignDialog {...defaultProps} />);

    // Fill form
    const cpSelect = screen.getByLabelText('Channel Partner');
    fireEvent.mouseDown(cpSelect);
    fireEvent.click(screen.getByText('Partner 1'));

    const remarksField = screen.getByLabelText('Remarks');
    fireEvent.change(remarksField, {
      target: { value: 'Test bulk reassign remarks' },
    });

    // Submit form
    const submitButton = screen.getByText(/Reassign \d+ Leads/);
    fireEvent.click(submitButton);

    // Should be in loading state
    await waitFor(() => {
      expect(screen.getByText('Reassigning...')).toBeInTheDocument();
    });
  });

  it('should show error when channel partner list fails to load', () => {
    jest
      .mocked(require('../../../hooks/useChannelPartners').useChannelPartners)
      .mockReturnValue({
        channelPartners: [],
        isLoading: false,
        error: new Error('Failed to load channel partners'),
      });

    renderWithProviders(<BulkReassignDialog {...defaultProps} />);

    expect(
      screen.getByText(/Error loading channel partners/)
    ).toBeInTheDocument();
  });

  it('should show loading state while fetching channel partners', () => {
    jest
      .mocked(require('../../../hooks/useChannelPartners').useChannelPartners)
      .mockReturnValue({
        channelPartners: [],
        isLoading: true,
        error: null,
      });

    renderWithProviders(<BulkReassignDialog {...defaultProps} />);

    expect(screen.getByText(/Loading channel partners/)).toBeInTheDocument();
  });
});
