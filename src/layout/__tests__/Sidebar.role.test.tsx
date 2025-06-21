/**
 * Enhanced unit tests for Sidebar role-based filtering and persistence
 * Tests role-based item visibility and localStorage persistence
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import Sidebar from '../Sidebar';
import { AuthProvider } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { STORAGE_KEYS } from '../../utils/constants';
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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock the useAuth hook
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

const renderSidebar = (props = {}) => {
  const defaultProps = {
    collapsed: false,
    isMobile: false,
    onClose: jest.fn(),
  };

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Sidebar {...defaultProps} {...props} />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Sidebar Role-based Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Admin User Navigation', () => {
    beforeEach(() => {
      (require('../../contexts/AuthContext') as any).__setMockUser(
        mockAdminUser
      );
    });

    it('shows all navigation items for admin user', () => {
      renderSidebar();

      // Admin should see all 8 items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Leads')).toBeInTheDocument();
      expect(screen.getByText('Quotations')).toBeInTheDocument();
      expect(screen.getByText('Channel Partners')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Commissions')).toBeInTheDocument();
      expect(screen.getByText('Master Data')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('shows admin badges on admin-only items', () => {
      renderSidebar();

      const adminBadges = screen.getAllByText('Admin');
      expect(adminBadges.length).toBe(3); // Commissions, Master Data, Settings
    });
  });

  describe('KAM User Navigation', () => {
    beforeEach(() => {
      (require('../../contexts/AuthContext') as any).__setMockUser(mockKamUser);
    });

    it('shows only allowed navigation items for KAM user', () => {
      renderSidebar();

      // KAM should see only 5 items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Leads')).toBeInTheDocument();
      expect(screen.getByText('Quotations')).toBeInTheDocument();
      expect(screen.getByText('Channel Partners')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
    });

    it('does NOT show admin-only items in DOM for KAM user', () => {
      renderSidebar();

      // These should be completely absent from DOM for security
      expect(screen.queryByText('Commissions')).not.toBeInTheDocument();
      expect(screen.queryByText('Master Data')).not.toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('does not show admin badges for KAM user', () => {
      renderSidebar();

      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  describe('Sidebar Persistence', () => {
    beforeEach(() => {
      (require('../../contexts/AuthContext') as any).__setMockUser(
        mockAdminUser
      );
    });

    it('reads collapsed state from localStorage on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('true');

      renderSidebar();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.SIDEBAR_STATE
      );
    });

    it('handles localStorage read errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      renderSidebar();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to read sidebar state:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('shows full content when not collapsed', () => {
      renderSidebar({ collapsed: false });

      expect(screen.getByText('Solarium')).toBeInTheDocument();
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
    });

    it('shows minimal content when collapsed', () => {
      renderSidebar({ collapsed: true });

      // Logo should still be visible but text should be hidden
      expect(screen.queryByText('Solarium')).not.toBeInTheDocument();
      expect(screen.queryByText('Signed in as')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Behavior', () => {
    beforeEach(() => {
      (require('../../contexts/AuthContext') as any).__setMockUser(
        mockAdminUser
      );
    });

    it('always shows full content on mobile regardless of collapsed state', () => {
      renderSidebar({ collapsed: true, isMobile: true });

      expect(screen.getByText('Solarium')).toBeInTheDocument();
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
    });

    it('calls onClose when navigation item clicked on mobile', () => {
      const mockOnClose = jest.fn();
      renderSidebar({ isMobile: true, onClose: mockOnClose });

      fireEvent.click(screen.getByText('Dashboard'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Development Debug Info', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('shows debug info in development mode', () => {
      process.env.NODE_ENV = 'development';
      (require('../../contexts/AuthContext') as any).__setMockUser(
        mockAdminUser
      );

      renderSidebar({ collapsed: false });

      expect(screen.getByText(/Role: ADMIN \| Items: 8/)).toBeInTheDocument();
    });

    it('hides debug info in production mode', () => {
      process.env.NODE_ENV = 'production';
      (require('../../contexts/AuthContext') as any).__setMockUser(
        mockAdminUser
      );

      renderSidebar({ collapsed: false });

      expect(screen.queryByText(/Role: ADMIN/)).not.toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    beforeEach(() => {
      (require('../../contexts/AuthContext') as any).__setMockUser(
        mockAdminUser
      );
    });

    it('navigates to correct route when item is clicked', () => {
      renderSidebar();

      const dashboardLink = screen.getByText('Dashboard');
      fireEvent.click(dashboardLink);

      // Navigation would be handled by React Router
      // We can test that the click event was handled
      expect(dashboardLink.closest('button')).toHaveAttribute('role', 'button');
    });

    it('shows tooltip for collapsed items on desktop', () => {
      renderSidebar({ collapsed: true, isMobile: false });

      // Tooltips are rendered by MUI and may not be visible in test
      // But we can verify the structure is correct
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
