/**
 * CSV Import Dialog Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CSVImportDialog } from '../CSVImportDialog';
import { setupApiStore } from '../../../test-utils';
import { leadEndpoints } from '../../../api/endpoints/leadEndpoints';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock CSV Toolkit
jest.mock('../../../services/csv', () => ({
  CSVToolkit: {
    validateFile: jest.fn(() => null),
    parseCSV: jest.fn(),
    validateLeadData: jest.fn(),
    getImportTemplate: jest.fn(
      () => 'name,phone,email\nJohn,1234567890,john@test.com'
    ),
    downloadCSV: jest.fn(),
  },
}));

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

describe('CSVImportDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with file selection step', () => {
    renderWithProviders(<CSVImportDialog {...defaultProps} />);

    expect(screen.getByText('Import Leads from CSV')).toBeInTheDocument();
    expect(screen.getByText('Choose CSV File')).toBeInTheDocument();
    expect(screen.getByText('Template')).toBeInTheDocument();
  });

  it('should show required and optional columns info', () => {
    renderWithProviders(<CSVImportDialog {...defaultProps} />);

    expect(screen.getByText(/Required columns:/)).toBeInTheDocument();
    expect(screen.getByText(/Optional columns:/)).toBeInTheDocument();
  });

  it('should handle template download', () => {
    const { CSVToolkit } = require('../../../services/csv');

    renderWithProviders(<CSVImportDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Template'));

    expect(CSVToolkit.getImportTemplate).toHaveBeenCalled();
    expect(CSVToolkit.downloadCSV).toHaveBeenCalledWith(
      'name,phone,email\nJohn,1234567890,john@test.com',
      'lead-import-template.csv'
    );
  });

  it('should validate file on selection', async () => {
    const { CSVToolkit } = require('../../../services/csv');
    CSVToolkit.validateFile.mockReturnValue('File too large');

    renderWithProviders(<CSVImportDialog {...defaultProps} />);

    const fileInput = screen
      .getByLabelText('Choose CSV File')
      .querySelector('input[type="file"]');
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput!);

    expect(CSVToolkit.validateFile).toHaveBeenCalledWith(file);
  });

  it('should parse and validate CSV data', async () => {
    const { CSVToolkit } = require('../../../services/csv');
    CSVToolkit.parseCSV.mockResolvedValue({
      data: [{ customerName: 'John', customerPhone: '1234567890' }],
      errors: [],
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
    });

    CSVToolkit.validateLeadData.mockReturnValue({
      isValid: true,
      errors: [],
      validatedData: [{ customerName: 'John', customerPhone: '1234567890' }],
    });

    renderWithProviders(<CSVImportDialog {...defaultProps} />);

    const fileInput = screen
      .getByLabelText('Choose CSV File')
      .querySelector('input[type="file"]');
    const file = new File(['name,phone\nJohn,1234567890'], 'test.csv', {
      type: 'text/csv',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput!);

    await waitFor(() => {
      expect(CSVToolkit.parseCSV).toHaveBeenCalledWith(file);
      expect(CSVToolkit.validateLeadData).toHaveBeenCalled();
    });
  });

  it('should show validation errors', async () => {
    const { CSVToolkit } = require('../../../services/csv');
    CSVToolkit.parseCSV.mockResolvedValue({
      data: [{ customerName: '', customerPhone: 'invalid' }],
      errors: [],
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
    });

    CSVToolkit.validateLeadData.mockReturnValue({
      isValid: false,
      errors: [
        { row: 1, field: 'customerName', reason: 'Name is required' },
        { row: 1, field: 'customerPhone', reason: 'Invalid phone format' },
      ],
      validatedData: [],
    });

    renderWithProviders(<CSVImportDialog {...defaultProps} />);

    const fileInput = screen
      .getByLabelText('Choose CSV File')
      .querySelector('input[type="file"]');
    const file = new File(['name,phone\n,invalid'], 'test.csv', {
      type: 'text/csv',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput!);

    await waitFor(() => {
      expect(screen.getByText(/Found 2 validation errors/)).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid phone format')).toBeInTheDocument();
    });
  });

  it('should disable import button when validation fails', async () => {
    const { CSVToolkit } = require('../../../services/csv');
    CSVToolkit.parseCSV.mockResolvedValue({
      data: [{ customerName: '', customerPhone: 'invalid' }],
      errors: [],
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
    });

    CSVToolkit.validateLeadData.mockReturnValue({
      isValid: false,
      errors: [{ row: 1, field: 'customerName', reason: 'Name is required' }],
      validatedData: [],
    });

    renderWithProviders(<CSVImportDialog {...defaultProps} />);

    const fileInput = screen
      .getByLabelText('Choose CSV File')
      .querySelector('input[type="file"]');
    const file = new File(['name,phone\n,invalid'], 'test.csv', {
      type: 'text/csv',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput!);

    await waitFor(() => {
      const importButton = screen.getByText(/Import \d+ Leads/);
      expect(importButton).toBeDisabled();
    });
  });

  it('should pass accessibility tests', async () => {
    const { container } = renderWithProviders(
      <CSVImportDialog {...defaultProps} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle over 50 rows error', async () => {
    const { CSVToolkit } = require('../../../services/csv');
    CSVToolkit.parseCSV.mockRejectedValue(
      new Error('CSV contains 51 rows, but maximum allowed is 50 rows.')
    );

    renderWithProviders(<CSVImportDialog {...defaultProps} />);

    const fileInput = screen
      .getByLabelText('Choose CSV File')
      .querySelector('input[type="file"]');
    const file = new File(['large content'], 'test.csv', { type: 'text/csv' });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput!);

    await waitFor(() => {
      expect(CSVToolkit.parseCSV).toHaveBeenCalledWith(file);
    });
  });
});
