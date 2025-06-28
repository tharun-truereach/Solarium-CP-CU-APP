/**
 * Bulk Action Toolbar Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkActionToolbar } from '../BulkActionToolbar';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../../hooks/useLeadAccess', () => ({
  useLeadAccess: () => ({
    isAdmin: true,
    isKAM: false,
  }),
}));

jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    showError: jest.fn(),
    showWarning: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useCSVExport', () => ({
  useCSVExport: () => ({
    exportLeads: jest.fn(),
    isExporting: false,
    error: null,
  }),
}));

const theme = createTheme();

const defaultProps = {
  selectedLeadIds: [],
  totalLeadsCount: 100,
  currentFilters: {},
  onUpdateStatus: jest.fn(),
  onReassign: jest.fn(),
  onClear: jest.fn(),
};

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('BulkActionToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when no leads selected and no filters', () => {
    const { container } = renderWithTheme(
      <BulkActionToolbar {...defaultProps} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render export button when filters are active', () => {
    renderWithTheme(
      <BulkActionToolbar
        {...defaultProps}
        currentFilters={{ status: 'In Discussion' }}
      />
    );

    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('should show selection info when leads are selected', () => {
    renderWithTheme(
      <BulkActionToolbar
        {...defaultProps}
        selectedLeadIds={['LEAD-001', 'LEAD-002']}
      />
    );

    expect(screen.getByText('2 Leads Selected')).toBeInTheDocument();
    expect(screen.getByText('Update Status')).toBeInTheDocument();
    expect(screen.getByText('Reassign')).toBeInTheDocument();
  });

  it('should show warning when over 50 leads selected', () => {
    const manyLeads = Array.from({ length: 51 }, (_, i) => `LEAD-${i}`);

    renderWithTheme(
      <BulkActionToolbar {...defaultProps} selectedLeadIds={manyLeads} />
    );

    expect(screen.getByText(/Selection limit exceeded/)).toBeInTheDocument();
    expect(screen.getByText('Limit: 50')).toBeInTheDocument();
  });

  it('should disable bulk actions when over limit', () => {
    const manyLeads = Array.from({ length: 51 }, (_, i) => `LEAD-${i}`);

    renderWithTheme(
      <BulkActionToolbar {...defaultProps} selectedLeadIds={manyLeads} />
    );

    const updateButton = screen.getByText('Update Status');
    const reassignButton = screen.getByText('Reassign');

    expect(updateButton).toBeDisabled();
    expect(reassignButton).toBeDisabled();
  });

  it('should call onUpdateStatus when update status clicked', () => {
    const onUpdateStatus = jest.fn();

    renderWithTheme(
      <BulkActionToolbar
        {...defaultProps}
        selectedLeadIds={['LEAD-001']}
        onUpdateStatus={onUpdateStatus}
      />
    );

    fireEvent.click(screen.getByText('Update Status'));
    expect(onUpdateStatus).toHaveBeenCalled();
  });

  it('should call onReassign when reassign clicked', () => {
    const onReassign = jest.fn();

    renderWithTheme(
      <BulkActionToolbar
        {...defaultProps}
        selectedLeadIds={['LEAD-001']}
        onReassign={onReassign}
      />
    );

    fireEvent.click(screen.getByText('Reassign'));
    expect(onReassign).toHaveBeenCalled();
  });

  it('should call onClear when clear button clicked', () => {
    const onClear = jest.fn();

    renderWithTheme(
      <BulkActionToolbar
        {...defaultProps}
        selectedLeadIds={['LEAD-001']}
        onClear={onClear}
      />
    );

    const clearButton = screen.getByLabelText('Clear Selection');
    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalled();
  });

  it('should pass accessibility tests', async () => {
    const { container } = renderWithTheme(
      <BulkActionToolbar
        {...defaultProps}
        selectedLeadIds={['LEAD-001', 'LEAD-002']}
        currentFilters={{ status: 'In Discussion' }}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle mobile view correctly', () => {
    // Mock mobile breakpoint
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('down'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    renderWithTheme(
      <BulkActionToolbar {...defaultProps} selectedLeadIds={['LEAD-001']} />
    );

    // Should have icon buttons instead of text buttons
    expect(screen.getByLabelText('Update Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Reassign')).toBeInTheDocument();
  });
});
