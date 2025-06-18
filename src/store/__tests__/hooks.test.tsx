/**
 * Redux hooks tests
 * Tests typed Redux hooks functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureAppStore } from '../index';
import { useAppDispatch, useAppSelector, useRedux } from '../hooks';
import { login, logout } from '../slices/authSlice';
import { LoginResponse } from '@/types';

// Test component using hooks
const TestComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const handleLogin = () => {
    const mockResponse: LoginResponse = {
      token: 'test-token',
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      expiresAt: '2023-01-02T00:00:00Z',
    };
    dispatch(login(mockResponse));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div>
      <div data-testid="auth-status">
        {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="user-email">{auth.user?.email || 'No User'}</div>
      <button onClick={handleLogin} data-testid="login-btn">
        Login
      </button>
      <button onClick={handleLogout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

// Test component using useRedux hook
const TestReduxComponent: React.FC = () => {
  const { selector } = useRedux();
  const auth = selector(state => state.auth);

  return (
    <div>
      <div data-testid="redux-status">
        {auth.isAuthenticated
          ? 'Redux Authenticated'
          : 'Redux Not Authenticated'}
      </div>
    </div>
  );
};

describe('Redux Hooks', () => {
  let store: ReturnType<typeof configureAppStore>;

  beforeEach(() => {
    store = configureAppStore();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('should provide typed dispatch and selector hooks', () => {
    renderWithProvider(<TestComponent />);

    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Not Authenticated'
    );
    expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
  });

  it('should handle login through hooks', () => {
    renderWithProvider(<TestComponent />);

    fireEvent.click(screen.getByTestId('login-btn'));

    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Authenticated'
    );
    expect(screen.getByTestId('user-email')).toHaveTextContent(
      'test@example.com'
    );
  });

  it('should handle logout through hooks', () => {
    renderWithProvider(<TestComponent />);

    // First login
    fireEvent.click(screen.getByTestId('login-btn'));
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Authenticated'
    );

    // Then logout
    fireEvent.click(screen.getByTestId('logout-btn'));
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Not Authenticated'
    );
    expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
  });

  it('should work with useRedux combined hook', () => {
    renderWithProvider(<TestReduxComponent />);

    expect(screen.getByTestId('redux-status')).toHaveTextContent(
      'Redux Not Authenticated'
    );
  });
});
