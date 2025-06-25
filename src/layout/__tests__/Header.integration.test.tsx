/**
 * Integration tests for Header component with notifications
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { store } from '../../store/store';
import Header from '../Header';
import { AuthProvider } from '../../contexts/AuthContext';

const theme = createTheme();

const mockUser = {
  id: '1',
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

const mockAuthContextValue = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  clearError: jest.fn(),
};

const renderHeader = (props = {}) => {
  const defaultProps = {
    drawerWidth: 280,
    onMenuClick: jest.fn(),
    isCollapsed: false,
    isMobile: false,
  };

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <Header {...defaultProps} {...props} />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Header Integration', () => {
  it('should render notification badge', () => {
    renderHeader();

    const notificationButton = screen.getByLabelText(/notifications/i);
    expect(notificationButton).toBeInTheDocument();
  });

  it('should open user menu when avatar is clicked', async () => {
    renderHeader();

    const avatarButton = screen.getByRole('button', {
      name: /account of current user/i,
    });
    fireEvent.click(avatarButton);

    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });
  });

  it('should show admin badge for admin users', () => {
    renderHeader();

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should handle mobile responsive layout', () => {
    renderHeader({ isMobile: true });

    // Should show mobile title
    expect(screen.getByText('Solarium')).toBeInTheDocument();
  });
});
