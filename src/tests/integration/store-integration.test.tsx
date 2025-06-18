/**
 * Integration test for Redux store with React components
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../../store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  login,
  selectIsAuthenticated,
  selectUser,
} from '../../store/slices/authSlice';
import {
  setThemeMode,
  selectThemeMode,
} from '../../store/slices/preferencesSlice';

// Mock persistence for testing
jest.mock('redux-persist/lib/storage');

// Test component that uses the store
const TestComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const themeMode = useAppSelector(selectThemeMode);

  const handleLogin = () => {
    dispatch(
      login({
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
      })
    );
  };

  const handleThemeChange = () => {
    dispatch(setThemeMode('dark'));
  };

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? `Logged in as ${user?.name}` : 'Not logged in'}
      </div>
      <div data-testid="theme-mode">Theme: {themeMode}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleThemeChange}>Change Theme</button>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
      {children}
    </PersistGate>
  </Provider>
);

describe('Store Integration with Components', () => {
  it('should allow components to interact with store via hooks', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Check initial state
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Not logged in'
    );
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('Theme: system');

    // Test login action
    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'Logged in as Test User'
    );

    // Test theme change action
    fireEvent.click(screen.getByText('Change Theme'));
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('Theme: dark');
  });
});
