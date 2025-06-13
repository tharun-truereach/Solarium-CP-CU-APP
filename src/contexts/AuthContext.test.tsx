/**
 * Test suite for AuthContext
 * Tests authentication state management and methods
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="user">{user ? user.name : 'No User'}</div>
      <button onClick={() => login('admin@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('provides initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('authenticated')).toHaveTextContent(
      'Not Authenticated'
    );
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  test('loads existing user from localStorage', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      role: 'admin' as const,
      name: 'admin',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'Authenticated'
      );
      expect(screen.getByTestId('user')).toHaveTextContent('admin');
    });
  });

  test('login function works correctly', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'Authenticated'
      );
      expect(screen.getByTestId('user')).toHaveTextContent('admin');
    });
  });

  test('logout function works correctly', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      role: 'admin' as const,
      name: 'admin',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'Authenticated'
      );
    });

    fireEvent.click(screen.getByText('Logout'));

    expect(screen.getByTestId('authenticated')).toHaveTextContent(
      'Not Authenticated'
    );
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    expect(localStorage.getItem('solarium_user')).toBeNull();
  });

  test('throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});
