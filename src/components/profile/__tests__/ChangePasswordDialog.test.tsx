/**
 * ChangePasswordDialog component unit tests
 * Ensures proper password change functionality and validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePasswordDialog } from '../index';

const mockOnSubmit = jest.fn();
const mockOnClose = jest.fn();

const defaultProps = {
  open: true,
  onClose: mockOnClose,
  onSubmit: mockOnSubmit,
  isLoading: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ChangePasswordDialog', () => {
  it('should render password change form', () => {
    render(<ChangePasswordDialog {...defaultProps} />);

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /change password/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<ChangePasswordDialog {...defaultProps} />);

    const submitButton = screen.getByRole('button', {
      name: /change password/i,
    });
    expect(submitButton).toBeDisabled();

    // Fill current password
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    fireEvent.change(currentPasswordInput, {
      target: { value: 'oldPassword' },
    });

    // Submit button should still be disabled until all fields are valid
    expect(submitButton).toBeDisabled();
  });

  it('should show password strength indicator', async () => {
    render(<ChangePasswordDialog {...defaultProps} />);

    const newPasswordInput = screen.getByLabelText(/new password/i);
    fireEvent.change(newPasswordInput, { target: { value: 'weak' } });

    await waitFor(() => {
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    // Test strong password
    fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });

    await waitFor(() => {
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });
  });

  it('should validate password confirmation', async () => {
    render(<ChangePasswordDialog {...defaultProps} />);

    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'DifferentPass123!' },
    });

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Fix password confirmation
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'StrongPass123!' },
    });

    await waitFor(() => {
      expect(screen.getByText(/passwords match/i)).toBeInTheDocument();
    });
  });

  it('should show/hide passwords when visibility toggle clicked', () => {
    render(<ChangePasswordDialog {...defaultProps} />);

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const showCurrentPasswordButton = screen.getByLabelText(
      /show current password/i
    );

    expect(currentPasswordInput).toHaveAttribute('type', 'password');

    fireEvent.click(showCurrentPasswordButton);
    expect(currentPasswordInput).toHaveAttribute('type', 'text');

    fireEvent.click(showCurrentPasswordButton);
    expect(currentPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should call onSubmit when form is valid and submitted', async () => {
    mockOnSubmit.mockResolvedValue(true);
    render(<ChangePasswordDialog {...defaultProps} />);

    // Fill all fields with valid data
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldPassword' },
    });
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'StrongPass123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'StrongPass123!' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        currentPassword: 'oldPassword',
        newPassword: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      });
    });
  });

  it('should handle submission errors', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Current password is incorrect'));
    render(<ChangePasswordDialog {...defaultProps} />);

    // Fill valid data
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'wrongPassword' },
    });
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'StrongPass123!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'StrongPass123!' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: /change password/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/current password is incorrect/i)
      ).toBeInTheDocument();
    });
  });

  it('should close dialog when cancel clicked', () => {
    render(<ChangePasswordDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable form when loading', () => {
    render(<ChangePasswordDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByLabelText(/current password/i)).toBeDisabled();
    expect(screen.getByLabelText(/new password/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm new password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
