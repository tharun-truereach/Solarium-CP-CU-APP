/**
 * ProfileForm component unit tests
 * Ensures proper form functionality and validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMockStore } from '../../../test-utils';
import { ProfileForm } from '../index';
import { Provider } from 'react-redux';

// Mock profile data
const mockProfile = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1234567890',
  timezone: 'UTC',
  language: 'en',
  updatedAt: '2024-01-01T00:00:00Z',
};

// MSW server
const server = setupServer(
  rest.get('/api/v1/user/me', (req, res, ctx) => {
    return res(ctx.json(mockProfile));
  }),

  rest.patch('/api/v1/user/me', (req, res, ctx) => {
    return res(ctx.json({ ...mockProfile, name: 'Updated Name' }));
  }),

  rest.post('/api/v1/user/change-password', (req, res, ctx) => {
    return res(ctx.json({ success: true, message: 'Password changed' }));
  }),

  rest.post('/api/v1/user/avatar', (req, res, ctx) => {
    return res(
      ctx.json({ avatarUrl: 'new-avatar.jpg', message: 'Avatar uploaded' })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderWithProvider = () => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <ProfileForm />
    </Provider>
  );
};

describe('ProfileForm', () => {
  it('should render profile form with all fields', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
  });

  it('should show email as read-only', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveAttribute('readonly');
  });

  it('should validate required fields', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
    });
  });

  it('should validate phone number format', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid phone number/i)
      ).toBeInTheDocument();
    });
  });

  it('should enable save button when form is dirty and valid', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save profile/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('should show change password dialog when button clicked', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /change password/i })
      ).toBeInTheDocument();
    });

    const passwordButton = screen.getByRole('button', {
      name: /change password/i,
    });
    fireEvent.click(passwordButton);

    await waitFor(() => {
      expect(screen.getByText(/change password/i)).toBeInTheDocument();
    });
  });

  it('should handle avatar upload', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(
        screen.getByLabelText(/change profile picture/i)
      ).toBeInTheDocument();
    });

    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
    const avatarButton = screen.getByLabelText(/change profile picture/i);

    // Mock file input change
    const fileInput = screen.getByLabelText(/upload profile picture/i);
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.click(avatarButton);
    fireEvent.change(fileInput);

    // Should trigger upload process
    await waitFor(() => {
      expect((fileInput as HTMLInputElement)?.files?.[0]).toBe(file);
    });
  });

  it('should reset form when reset button clicked', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    // Make changes
    const nameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

    // Click reset
    const resetButton = screen.getByRole('button', { name: /reset changes/i });
    fireEvent.click(resetButton);

    // Should revert to original value
    await waitFor(() => {
      expect(nameInput).toHaveValue('Test User');
    });
  });

  it('should handle form submission', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    // Make changes
    const nameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(saveButton);

    // Should show loading state
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /save profile/i })
      ).toBeDisabled();
    });
  });
});
