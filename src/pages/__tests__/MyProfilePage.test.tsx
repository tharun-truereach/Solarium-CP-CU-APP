/**
 * MyProfilePage component unit tests
 * Ensures proper page rendering and accessibility
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createMockStore } from '../../test-utils';
import MyProfilePage from '../MyProfilePage';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

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

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin' as const,
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// MSW server
const server = setupServer(
  rest.get('/api/v1/user/me', (req, res, ctx) => {
    return res(ctx.json(mockProfile));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderWithProviders = (user = mockUser) => {
  const store = createMockStore();

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <MyProfilePage />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('MyProfilePage', () => {
  it('should render page header and breadcrumbs', async () => {
    renderWithProviders();

    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('breadcrumb')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /dashboard/i })
    ).toBeInTheDocument();
  });

  it('should render welcome message with user name', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/welcome, test user!/i)).toBeInTheDocument();
    });
  });

  it('should render profile form', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('should show error when user not authenticated', () => {
    renderWithProviders();

    expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
    expect(screen.getByText(/you must be logged in/i)).toBeInTheDocument();
  });

  it('should render help section', () => {
    renderWithProviders();

    expect(screen.getByText(/need help\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/email changes require admin approval/i)
    ).toBeInTheDocument();
  });

  it('should show development info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderWithProviders();

    expect(screen.getByText(/development info/i)).toBeInTheDocument();
    expect(screen.getByText(/route: \/my-profile/i)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should have proper heading structure for accessibility', () => {
    renderWithProviders();

    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('My Profile');

    const subHeadings = screen.getAllByRole('heading', { level: 6 });
    expect(subHeadings.length).toBeGreaterThan(0);
  });

  it('should have proper landmark roles', () => {
    renderWithProviders();

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByLabelText('breadcrumb')).toBeInTheDocument();
  });
});
