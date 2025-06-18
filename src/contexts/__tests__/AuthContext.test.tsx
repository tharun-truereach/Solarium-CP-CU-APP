/**
 * AuthContext tests
 * Tests the Redux façade maintains backward compatibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureAppStore } from '@/store';
import { AuthProvider, useAuth } from '../AuthContext';

// Test component that uses AuthContext
const TestAuthComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'test@example.com', password: 'password' });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="loading-status">
        {isLoading ? 'Loading' : 'Not Loading'}
      </div>
      <div data-testid="user-info">
        {user ? `${user.firstName} ${user.lastName}` : 'No User'}
      </div>
      <button
        onClick={handleLogin}
        data-testid="login-btn"
        disabled={isLoading}
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

describe('AuthContext (Redux Façade)', () => {
  let store: ReturnType<typeof configureAppStore>;

  beforeEach(() => {
    store = configureAppStore();
    // Clear localStorage before each test
    localStorage.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <AuthProvider>{component}</AuthProvider>
      </Provider>
    );
  };

  it('should provide initial auth state', () => {
    renderWithProviders(<TestAuthComponent />);

    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Not Authenticated'
    );
    expect(screen.getByTestId('loading-status')).toHaveTextContent(
      'Not Loading'
    );
    expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
  });

  it('should handle login flow with loading state', async () => {
    renderWithProviders(<TestAuthComponent />);

    fireEvent.click(screen.getByTestId('login-btn'));

    // Should show loading state
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading');

    // Wait for login to complete (auth-status to become Authenticated)
    await waitFor(
      () => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(
          'Authenticated'
        );
      },
      { timeout: 2000 }
    );

    // Add this new waitFor to ensure loading state is reset
    await waitFor(
      () => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent(
          'Not Loading'
        );
      },
      { timeout: 2000 }
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
  });

  it('should handle logout', async () => {
    renderWithProviders(<TestAuthComponent />);

    // First login
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated'
      );
    });

    // Then logout
    fireEvent.click(screen.getByTestId('logout-btn'));

    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Not Authenticated'
    );
    expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => {
      render(<TestAuthComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  it('should maintain backward compatibility API', () => {
    const TestAPIComponent: React.FC = () => {
      const auth = useAuth();

      // Test that all expected properties exist
      const requiredProperties = [
        'user',
        'token',
        'isAuthenticated',
        'isLoading',
        'login',
        'logout',
        'refreshToken',
        'updateProfile',
      ];

      const missingProperties = requiredProperties.filter(
        prop => !(prop in auth)
      );

      return (
        <div data-testid="api-check">
          {missingProperties.length === 0
            ? 'API Complete'
            : `Missing: ${missingProperties.join(', ')}`}
        </div>
      );
    };

    renderWithProviders(<TestAPIComponent />);

    expect(screen.getByTestId('api-check')).toHaveTextContent('API Complete');
  });
});
