/**
 * Integration test for auth endpoints with enhanced functionality
 * Tests the complete authentication flow with RTK Query
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureAppStore } from '../../store/store';
import {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
} from '../../api/endpoints/authEndpoints';
import { useAppSelector } from '../../store/hooks';
import {
  selectIsAuthenticated,
  selectUser,
  selectAuthError,
} from '../../store/slices/authSlice';

// Mock fetch for API calls
global.fetch = jest.fn();

// Test component using enhanced auth endpoints
const EnhancedAuthTestComponent: React.FC = () => {
  const [login, { isLoading: isLoginLoading, error: loginError }] =
    useLoginMutation();
  const [logout, { isLoading: isLogoutLoading }] = useLogoutMutation();
  const [refreshToken, { isLoading: isRefreshLoading }] =
    useRefreshTokenMutation();
  const [updateProfile, { isLoading: isUpdateLoading }] =
    useUpdateProfileMutation();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const authError = useAppSelector(selectAuthError);

  // Auto-fetch current user when authenticated
  const { data: currentUser, isLoading: isUserLoading } =
    useGetCurrentUserQuery(undefined, {
      skip: !isAuthenticated,
    });

  const handleLogin = () => {
    login({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    });
  };

  const handleLogout = () => {
    logout();
  };

  const handleRefreshToken = () => {
    refreshToken();
  };

  const handleUpdateProfile = () => {
    updateProfile({
      name: 'Updated Name',
      phoneNumber: '+1234567890',
    });
  };

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? `Logged in as ${user?.name}` : 'Not logged in'}
      </div>

      <div data-testid="user-info">
        {currentUser &&
          `Current user: ${currentUser.email} (${currentUser.role})`}
      </div>

      {!isAuthenticated ? (
        <button
          onClick={handleLogin}
          disabled={isLoginLoading}
          data-testid="login-button"
        >
          {isLoginLoading ? 'Logging in...' : 'Login'}
        </button>
      ) : (
        <div>
          <button
            onClick={handleLogout}
            disabled={isLogoutLoading}
            data-testid="logout-button"
          >
            {isLogoutLoading ? 'Logging out...' : 'Logout'}
          </button>

          <button
            onClick={handleRefreshToken}
            disabled={isRefreshLoading}
            data-testid="refresh-button"
          >
            {isRefreshLoading ? 'Refreshing...' : 'Refresh Token'}
          </button>

          <button
            onClick={handleUpdateProfile}
            disabled={isUpdateLoading}
            data-testid="update-profile-button"
          >
            {isUpdateLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      )}

      {(loginError || authError) && (
        <div data-testid="error-message">
          Error: {JSON.stringify(loginError || authError)}
        </div>
      )}

      {isUserLoading && <div data-testid="user-loading">Loading user...</div>}
    </div>
  );
};

describe('Enhanced Auth Endpoints Integration', () => {
  let store: ReturnType<typeof configureAppStore>;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    store = configureAppStore();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    jest.clearAllMocks();
  });

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => <Provider store={store}>{children}</Provider>;

  it('should handle complete login flow with user fetching', async () => {
    // Mock successful login response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          permissions: ['users:read', 'users:write'],
          isActive: true,
          isVerified: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
        token: 'test-jwt-token',
        refreshToken: 'test-refresh-token',
        expiresAt: '2023-12-31T23:59:59Z',
        sessionId: 'session-123',
      }),
      headers: new Headers(),
    } as Response);

    // Mock current user fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        permissions: ['users:read', 'users:write'],
        isActive: true,
        isVerified: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      }),
      headers: new Headers(),
    } as Response);

    render(
      <TestWrapper>
        <EnhancedAuthTestComponent />
      </TestWrapper>
    );

    // Initially not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Not logged in'
    );
    expect(screen.getByTestId('login-button')).toBeInTheDocument();

    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));

    // Should show loading state
    expect(screen.getByTestId('login-button')).toHaveTextContent(
      'Logging in...'
    );

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Logged in as Test User'
      );
    });

    // Should show logout button and other authenticated actions
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    expect(screen.getByTestId('update-profile-button')).toBeInTheDocument();

    // Should fetch and display current user
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(
        'Current user: test@example.com (admin)'
      );
    });

    // Verify API calls were made
    expect(mockFetch).toHaveBeenCalledTimes(2); // Login + getCurrentUser
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true,
        }),
      })
    );
  });

  it('should handle token refresh', async () => {
    // First setup authenticated state
    const initialState = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        permissions: [],
        isActive: true,
        isVerified: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
      token: 'old-token',
      refreshToken: 'refresh-token',
      expiresAt: '2023-12-31T23:59:59Z',
    };

    store.dispatch({
      type: 'auth/login',
      payload: initialState,
    });

    // Mock successful refresh response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresAt: '2024-01-01T00:00:00Z',
      }),
      headers: new Headers(),
    } as Response);

    render(
      <TestWrapper>
        <EnhancedAuthTestComponent />
      </TestWrapper>
    );

    // Should be authenticated initially
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Logged in as Test User'
    );

    // Click refresh token button
    fireEvent.click(screen.getByTestId('refresh-button'));

    // Should show loading state
    expect(screen.getByTestId('refresh-button')).toHaveTextContent(
      'Refreshing...'
    );

    // Wait for refresh to complete
    await waitFor(() => {
      expect(screen.getByTestId('refresh-button')).toHaveTextContent(
        'Refresh Token'
      );
    });

    // Verify API call was made
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      expect.objectContaining({
        method: 'POST',
      })
    );

    // Token should be updated in store
    const newState = store.getState();
    expect(newState.auth.token).toBe('new-jwt-token');
  });

  it('should handle profile updates', async () => {
    // Setup authenticated state
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          permissions: [],
          isActive: true,
          isVerified: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
        token: 'test-token',
        expiresAt: '2023-12-31T23:59:59Z',
      },
    });

    // Mock successful profile update response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        phoneNumber: '+1234567890',
        role: 'admin',
        permissions: [],
        isActive: true,
        isVerified: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      }),
      headers: new Headers(),
    } as Response);

    render(
      <TestWrapper>
        <EnhancedAuthTestComponent />
      </TestWrapper>
    );

    // Click update profile button
    fireEvent.click(screen.getByTestId('update-profile-button'));

    // Should show loading state
    expect(screen.getByTestId('update-profile-button')).toHaveTextContent(
      'Updating...'
    );

    // Wait for update to complete
    await waitFor(() => {
      expect(screen.getByTestId('update-profile-button')).toHaveTextContent(
        'Update Profile'
      );
    });

    // Verify API call was made
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/profile'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Name',
          phoneNumber: '+1234567890',
        }),
      })
    );
  });

  it('should handle login errors with enhanced error information', async () => {
    // Mock login error response with lockout info
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        message: 'Invalid credentials',
        lockoutInfo: {
          attempts: 3,
          lockedUntil: null,
        },
        requiresCaptcha: false,
      }),
      headers: new Headers(),
    } as Response);

    render(
      <TestWrapper>
        <EnhancedAuthTestComponent />
      </TestWrapper>
    );

    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    // Should still be not authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Not logged in'
    );

    // Error should contain enhanced information
    const errorElement = screen.getByTestId('error-message');
    expect(errorElement.textContent).toContain('Invalid credentials');
  });

  it('should handle logout with proper cleanup', async () => {
    // Setup authenticated state
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          permissions: [],
          isActive: true,
          isVerified: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
        token: 'test-token',
        expiresAt: '2023-12-31T23:59:59Z',
      },
    });

    // Mock successful logout response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: new Headers(),
    } as Response);

    render(
      <TestWrapper>
        <EnhancedAuthTestComponent />
      </TestWrapper>
    );

    // Should be authenticated initially
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Logged in as Test User'
    );

    // Click logout button
    fireEvent.click(screen.getByTestId('logout-button'));

    // Should show loading state
    expect(screen.getByTestId('logout-button')).toHaveTextContent(
      'Logging out...'
    );

    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Not logged in'
      );
    });

    // Should show login button
    expect(screen.getByTestId('login-button')).toBeInTheDocument();

    // Verify API call was made
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should handle authentication headers correctly', async () => {
    // Setup authenticated state
    store.dispatch({
      type: 'auth/login',
      payload: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          permissions: [],
          isActive: true,
          isVerified: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
        token: 'test-jwt-token',
        expiresAt: '2023-12-31T23:59:59Z',
      },
    });

    // Mock current user response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        permissions: [],
        isActive: true,
        isVerified: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      }),
      headers: new Headers(),
    } as Response);

    render(
      <TestWrapper>
        <EnhancedAuthTestComponent />
      </TestWrapper>
    );

    // Wait for current user query to trigger
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: 'Bearer test-jwt-token',
          }),
        })
      );
    });
  });
});
