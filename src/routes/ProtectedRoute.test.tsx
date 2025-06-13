/**
 * Test suite for ProtectedRoute component
 * Tests authentication and authorization logic
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const TestComponent = () => (
  <div data-testid="protected-content">Protected Content</div>
);

const renderWithProviders = (
  allowedRoles?: string[],
  initialEntries: string[] = ['/']
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <ProtectedRoute {...(allowedRoles && { allowedRoles })}>
          <TestComponent />
        </ProtectedRoute>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows loading state initially', () => {
    renderWithProviders();

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });
  });

  test('shows content for authenticated users', async () => {
    // Mock authenticated user
    const mockUser = {
      id: '1',
      email: 'admin@solarium.com',
      role: 'admin' as const,
      name: 'Admin User',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    renderWithProviders(['admin']);

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  test('shows access denied for wrong role', async () => {
    // Mock KAM user
    const mockUser = {
      id: '2',
      email: 'kam@solarium.com',
      role: 'kam' as const,
      name: 'KAM User',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    renderWithProviders(['admin']);

    await waitFor(() => {
      expect(screen.getByText('403 - Access Denied')).toBeInTheDocument();
    });
  });

  test('allows access for correct role', async () => {
    // Mock KAM user
    const mockUser = {
      id: '2',
      email: 'kam@solarium.com',
      role: 'kam' as const,
      name: 'KAM User',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    renderWithProviders(['kam', 'admin']);

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  test('allows access when no roles specified', async () => {
    // Mock authenticated user
    const mockUser = {
      id: '1',
      email: 'admin@solarium.com',
      role: 'admin' as const,
      name: 'Admin User',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    renderWithProviders(); // No roles specified

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
