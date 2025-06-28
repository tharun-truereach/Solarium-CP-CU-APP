/**
 * Integration tests for LeadGrid with BulkActionToolbar
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LeadGrid from '../LeadGrid';
import type { Lead } from '../../../types/lead.types';

// Mock dependencies
jest.mock('../../../hooks/useLeadAccess', () => ({
  useLeadAccess: () => ({
    canPerformAction: () => ({ hasAccess: true }),
  }),
}));

jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    showError: jest.fn(),
  }),
}));

const theme = createTheme();

const mockLeads: Lead[] = [
  {
    id: 'LEAD-001',
    leadId: 'LEAD-001',
    customerName: 'Test Customer 1',
    customerPhone: '1234567890',
    address: 'Test Address 1',
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
];

const defaultProps = {
  leads: mockLeads,
  total: mockLeads.length,
  loading: false,
  error: null,
  page: 0,
  pageSize: 25,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
  selectedLeads: [],
  onPageChange: jest.fn(),
  onPageSizeChange: jest.fn(),
  onSortChange: jest.fn(),
  onLeadSelect: jest.fn(),
  onSelectAll: jest.fn(),
  onBulkUpdateStatus: jest.fn(),
  onBulkReassign: jest.fn(),
  onBulkExport: jest.fn(),
};

const renderWithTheme = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <LeadGrid {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('LeadGrid with BulkActionToolbar Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not show bulk toolbar when no leads selected', () => {
    renderWithTheme({ selectedLeads: [] });
    expect(screen.queryByText(/leads selected/)).not.toBeInTheDocument();
  });

  it('should show bulk toolbar when leads are selected', () => {
    renderWithTheme({ selectedLeads: ['LEAD-001', 'LEAD-002'] });
    expect(screen.getByText('2 leads selected')).toBeInTheDocument();
    expect(screen.getByText('Update Status')).toBeInTheDocument();
    expect(screen.getByText('Reassign')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should call bulk action handlers when buttons clicked', () => {
    const onBulkUpdateStatus = jest.fn();
    const onBulkReassign = jest.fn();
    const onBulkExport = jest.fn();

    renderWithTheme({
      selectedLeads: ['LEAD-001'],
      onBulkUpdateStatus,
      onBulkReassign,
      onBulkExport,
    });

    fireEvent.click(screen.getByText('Update Status'));
    expect(onBulkUpdateStatus).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Reassign'));
    expect(onBulkReassign).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Export'));
    expect(onBulkExport).toHaveBeenCalledTimes(1);
  });

  it('should clear selection when clear button clicked', () => {
    const onSelectAll = jest.fn();
    renderWithTheme({
      selectedLeads: ['LEAD-001', 'LEAD-002'],
      onSelectAll,
    });

    const clearButton = screen.getByRole('button', {
      name: /clear selection/i,
    });
    fireEvent.click(clearButton);

    expect(onSelectAll).toHaveBeenCalledWith(false);
  });
});
