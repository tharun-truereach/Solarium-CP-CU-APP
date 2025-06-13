/**
 * Test suite for AppModal component
 * Tests modal behavior, accessibility, and responsiveness
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import AppModal from './AppModal';
import { theme } from '../../theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('AppModal', () => {
  test('renders when open', () => {
    renderWithTheme(
      <AppModal
        open={true}
        onClose={() => {
          /* noop */
        }}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </AppModal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderWithTheme(
      <AppModal
        open={false}
        onClose={() => {
          /* noop */
        }}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </AppModal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();

    renderWithTheme(
      <AppModal open={true} onClose={handleClose} title="Test Modal">
        <div>Modal Content</div>
      </AppModal>
    );

    fireEvent.click(screen.getByLabelText('close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('renders with actions', () => {
    const actions = <button data-testid="action-button">Action</button>;

    renderWithTheme(
      <AppModal
        open={true}
        onClose={() => {
          /* noop */
        }}
        title="Test Modal"
        actions={actions}
      >
        <div>Modal Content</div>
      </AppModal>
    );

    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  test('renders without close button when specified', () => {
    renderWithTheme(
      <AppModal
        open={true}
        onClose={() => {
          /* noop */
        }}
        title="Test Modal"
        closeButton={false}
      >
        <div>Modal Content</div>
      </AppModal>
    );

    expect(screen.queryByLabelText('close')).not.toBeInTheDocument();
  });
});
