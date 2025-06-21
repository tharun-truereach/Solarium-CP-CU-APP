/**
 * Integration tests for Dashboard layout and responsive behavior
 * Tests grid responsiveness and role-based rendering
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import Dashboard from '../Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import type { User } from '../../types';

const mockAdminUser: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockKamUser: User = {
  ...mockAdminUser,
  id: '2',
  email: 'kam@test.com',
  name: 'KAM User',
  firstName: 'KAM',
  role: 'kam',
};

const renderDashboard = (user: User) => {
  const AuthContextValue = {
    user,
    token: 'fake-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    sessionStatus: {
      isAuthenticated: true,
      isTokenExpired: false,
      isAccountLocked: false,
      timeRemaining: 3600000,
      isActive: true,
      needsWarning: false,
    },
    loginAttempts: 0,
    isAccountLocked: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    updateProfile: jest.fn(),
    checkPermission: jest.fn(),
    checkRole: jest.fn(),
    clearError: jest.fn(),
    updateUserActivity: jest.fn(),
    showSessionExpiredWarning: jest.fn(),
    hideSessionExpiredWarning: jest.fn(),
    getTokenTimeRemaining: jest.fn(),
    formatTokenExpiration: jest.fn(),
    isTokenExpiringSoon: jest.fn(),
  };

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <div
            style={{
              background: AuthContextValue as any,
              display: 'contents',
            }}
          >
            <Dashboard />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock the useAuth hook to return our test data
jest.mock('../../contexts/AuthContext', () => {
  let mockUser: User | null = null;

  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({
      user: mockUser,
      token: 'fake-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }),
    __setMockUser: (user: User | null) => {
      mockUser = user;
    },
  };
});

describe('Dashboard Layout', () => {
  beforeEach(() => {
    (require('../../contexts/AuthContext') as any).__setMockUser(mockAdminUser);
  });

  it('renders welcome message with user name', () => {
    renderDashboard(mockAdminUser);

    expect(screen.getByText('Welcome back, Admin!')).toBeInTheDocument();
  });

  it('renders all three placeholder widgets', () => {
    renderDashboard(mockAdminUser);

    expect(screen.getByText('Recent Leads')).toBeInTheDocument();
    expect(screen.getByText('Key Performance Indicators')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('shows admin-specific quick actions for admin user', () => {
    (require('../../contexts/AuthContext') as any).__setMockUser(mockAdminUser);
    renderDashboard(mockAdminUser);

    expect(screen.getByText('View Leads')).toBeInTheDocument();
    expect(screen.getByText('Create Quotation')).toBeInTheDocument();
    expect(screen.getByText('Manage Partners')).toBeInTheDocument();
    expect(screen.getByText('View Reports')).toBeInTheDocument();
  });

  it('shows limited quick actions for KAM user', () => {
    (require('../../contexts/AuthContext') as any).__setMockUser(mockKamUser);
    renderDashboard(mockKamUser);

    expect(screen.getByText('View Leads')).toBeInTheDocument();
    expect(screen.getByText('Create Quotation')).toBeInTheDocument();
    expect(screen.queryByText('Manage Partners')).not.toBeInTheDocument();
    expect(screen.queryByText('View Reports')).not.toBeInTheDocument();
  });

  it('renders activity summary panel', () => {
    renderDashboard(mockAdminUser);

    expect(screen.getByText('Activity Summary')).toBeInTheDocument();
    expect(screen.getByText('Recent system activity')).toBeInTheDocument();
  });

  it('has proper responsive grid structure', () => {
    const { container } = renderDashboard(mockAdminUser);

    // Check for MUI Grid containers
    const gridContainers = container.querySelectorAll('.MuiGrid-container');
    expect(gridContainers.length).toBeGreaterThan(0);

    // Check for grid items
    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems.length).toBeGreaterThan(0);
  });

  it('applies correct business vs territory context', () => {
    renderDashboard(mockAdminUser);
    expect(screen.getByText(/business today/)).toBeInTheDocument();

    (require('../../contexts/AuthContext') as any).__setMockUser(mockKamUser);
    renderDashboard(mockKamUser);
    expect(screen.getByText(/territory today/)).toBeInTheDocument();
  });
});
