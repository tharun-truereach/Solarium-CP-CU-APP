/**
 * Profile endpoints integration tests
 * Tests the full flow with React components
 */

import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, createMockStore } from '../../../test-utils';
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} from '../profileEndpoints';

// Mock profile data
const mockProfile = {
  id: 'user-123',
  email: 'test@solarium.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1234567890',
  updatedAt: '2024-01-01T00:00:00Z',
};

// MSW server setup
const server = setupServer(
  rest.get('/api/v1/user/me', (req, res, ctx) => {
    return res(ctx.json(mockProfile));
  }),

  rest.patch('/api/v1/user/me', (req, res, ctx) => {
    return res(ctx.json({ ...mockProfile, name: 'Updated Name' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test component that uses profile hooks
const TestProfileComponent: React.FC = () => {
  const { data: profile, isLoading, error } = useGetMyProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateMyProfileMutation();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile</div>;

  return (
    <div>
      <div data-testid="profile-name">{profile?.name}</div>
      <div data-testid="profile-email">{profile?.email}</div>
      <button
        onClick={() => updateProfile({ name: 'Updated Name' })}
        data-testid="update-button"
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );
};

describe('Profile Integration Tests', () => {
  it('should load and display profile data', async () => {
    const store = createMockStore();

    render(<TestProfileComponent />, { store });

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toBeInTheDocument();
    });

    expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
    expect(screen.getByTestId('profile-email')).toHaveTextContent(
      'test@solarium.com'
    );
  });

  it('should handle profile update', async () => {
    const store = createMockStore();

    render(<TestProfileComponent />, { store });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('update-button')).toBeInTheDocument();
    });

    // Click update button
    const updateButton = screen.getByTestId('update-button');
    fireEvent.click(updateButton);

    // Should show updating state
    expect(screen.getByText('Updating...')).toBeInTheDocument();

    // Wait for update to complete
    await waitFor(() => {
      expect(screen.getByText('Update Profile')).toBeInTheDocument();
    });
  });

  it('should handle profile loading error', async () => {
    server.use(
      rest.get('/api/v1/user/me', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    const store = createMockStore();

    render(<TestProfileComponent />, { store });

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Error loading profile')).toBeInTheDocument();
    });
  });

  it('should handle profile update error', async () => {
    server.use(
      rest.patch('/api/v1/user/me', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ message: 'Validation error' }));
      })
    );

    const store = createMockStore();

    render(<TestProfileComponent />, { store });

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('update-button')).toBeInTheDocument();
    });

    // Click update button
    const updateButton = screen.getByTestId('update-button');
    fireEvent.click(updateButton);

    // Wait for update to complete (should handle error gracefully)
    await waitFor(() => {
      expect(screen.getByText('Update Profile')).toBeInTheDocument();
    });
  });
});
