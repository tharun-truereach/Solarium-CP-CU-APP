/**
 * Tests for ResultDialog component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ResultDialog from '../ResultDialog';
import type { BulkOperationResponse } from '../../../types/lead.types';

const theme = createTheme();

const successResult: BulkOperationResponse = {
  success: true,
  data: {
    total: 3,
    successful: 3,
    failed: 0,
    results: [
      { id: 'LEAD-001', success: true },
      { id: 'LEAD-002', success: true },
      { id: 'LEAD-003', success: true },
    ],
  },
};

const partialResult: BulkOperationResponse = {
  success: true,
  data: {
    total: 3,
    successful: 2,
    failed: 1,
    results: [
      { id: 'LEAD-001', success: true },
      { id: 'LEAD-002', success: true },
      { id: 'LEAD-003', success: false, error: 'Invalid status transition' },
    ],
  },
};

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  title: 'Test Results',
  result: successResult,
};

const renderWithTheme = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <ResultDialog {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('ResultDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display success summary for all successful results', () => {
    renderWithTheme();

    expect(screen.getByText('Test Results')).toBeInTheDocument();
    expect(screen.getByText('3 Total')).toBeInTheDocument();
    expect(screen.getByText('3 Successful')).toBeInTheDocument();
    expect(
      screen.getByText('All items processed successfully!')
    ).toBeInTheDocument();
  });

  it('should display partial success summary for mixed results', () => {
    renderWithTheme({ result: partialResult });

    expect(screen.getByText('2 Successful')).toBeInTheDocument();
    expect(screen.getByText('1 Failed')).toBeInTheDocument();
    expect(screen.getByText('Partial success')).toBeInTheDocument();
  });

  it('should display detailed results for each item', () => {
    renderWithTheme({ result: partialResult });

    expect(screen.getByText('LEAD-001')).toBeInTheDocument();
    expect(screen.getByText('LEAD-002')).toBeInTheDocument();
    expect(screen.getByText('LEAD-003')).toBeInTheDocument();
    expect(screen.getByText('Invalid status transition')).toBeInTheDocument();
  });

  it('should show retry button when showRetryForFailed is true', () => {
    const onRetryFailed = jest.fn();
    renderWithTheme({
      result: partialResult,
      showRetryForFailed: true,
      onRetryFailed,
    });

    const retryButton = screen.getByText('Retry Failed (1)');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetryFailed).toHaveBeenCalledWith(['LEAD-003']);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    renderWithTheme({ onClose });

    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
