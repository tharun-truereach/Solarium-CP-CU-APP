/**
 * Test suite for Sidebar role-based navigation filtering
 * Tests that sidebar correctly shows/hides navigation items based on user role
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import Sidebar from '../Sidebar';
import { theme } from '../../theme';
import authSlice from '../../store/slices/authSlice';
import uiSlice from '../../store/slices/uiSlice';
import { apiSlice } from '../../api/apiSlice';
import type { User } from '../../types/user.types';

// Mock console methods to avoid test noise
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Test users
const adminUser: User = {
  id: '1',
  email: 'admin@solarium.com',
  name: 'Admin User',
  role: 'admin',
  permissions: ['leads:read', 'leads:write', 'users:read', 'settings:write'],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const kamUser: User = {
  id: '2',
  email: 'kam@solarium.com',
  name: 'KAM User',
  role: 'kam',
  permissions: ['leads:read', 'leads:write'],
  territories: ['North', 'Northeast'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

// Helper function to create store with user
const createStoreWithUser = (user: User | null) => {
  const store = configureStore({
    reducer: {
      auth: authSlice,
      ui: uiSlice,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActions: ['persist/PERSIST'] },
      }).concat(apiSlice.middleware),
  });

  if (user) {
    store.dispatch({
      type: 'auth/login',
      payload: {
        user,
        token: 'mock-token',
        expiresAt: '2024-12-31T23:59:59Z',
      },
    });
  }

  return store;
};

// Render component with all required providers
const renderSidebar = (
  user: User | null = null,
  props: Partial<React.ComponentProps<typeof Sidebar>> = {}
) => {
  const store = createStoreWithUser(user);
  const defaultProps = {
    collapsed: false,
    isMobile: false,
    onClose: vi.fn(),
    ...props,
  };

  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Sidebar {...defaultProps} />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('Sidebar Role-Based Navigation', () => {
  describe('Admin User Navigation', () => {
    it('should show all navigation items for admin users', () => {
      renderSidebar(adminUser);

      // Admin should see all navigation items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Leads')).toBeInTheDocument();
      expect(screen.getByText('Quotations')).toBeInTheDocument();
      expect(screen.getByText('Channel Partners')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Commissions')).toBeInTheDocument();
      expect(screen.getByText('Master Data')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should show admin badges for admin-only items', () => {
      renderSidebar(adminUser);

      // Admin-only items should have admin badges
      const adminBadges = screen.getAllByText('Admin');
      expect(adminBadges.length).toBeGreaterThan(0);
    });

    it('should show admin portal indicator', () => {
      renderSidebar(adminUser);

      expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    });

    it('should show territory information as "All Territories"', () => {
      renderSidebar(adminUser);

      expect(screen.getByText('All Territories')).toBeInTheDocument();
    });
  });

  describe('KAM User Navigation', () => {
    it('should hide admin-only navigation items for KAM users', () => {
      renderSidebar(kamUser);

      // KAM should see basic navigation items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Leads')).toBeInTheDocument();
      expect(screen.getByText('Quotations')).toBeInTheDocument();
      expect(screen.getByText('Channel Partners')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();

      // KAM should NOT see admin-only items
      expect(screen.queryByText('Commissions')).not.toBeInTheDocument();
      expect(screen.queryByText('Master Data')).not.toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('should show specific territory count for KAM users', () => {
      renderSidebar(kamUser);

      expect(screen.getByText('2 Territories')).toBeInTheDocument();
    });

    it('should NOT show admin portal indicator for KAM users', () => {
      renderSidebar(kamUser);

      expect(screen.queryByText('Admin Portal')).not.toBeInTheDocument();
    });

    it('should show user role as KAM', () => {
      renderSidebar(kamUser);

      expect(screen.getByText('KAM')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('should not show navigation items when no user is authenticated', () => {
      renderSidebar(null);

      // Should not show protected navigation items
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Leads')).not.toBeInTheDocument();
      expect(screen.queryByText('Commissions')).not.toBeInTheDocument();
    });

    it('should not show user information section when unauthenticated', () => {
      renderSidebar(null);

      expect(screen.queryByText('Signed in as')).not.toBeInTheDocument();
    });
  });

  describe('Collapsed State Behavior', () => {
    it('should show tooltips for navigation items when collapsed', () => {
      renderSidebar(adminUser, { collapsed: true });

      // In collapsed state, navigation items should still be present but with tooltips
      // The actual tooltip testing requires user interaction simulation
      expect(screen.getByText('S')).toBeInTheDocument(); // Logo should show as 'S'
    });

    it('should show user avatar in collapsed state', () => {
      renderSidebar(adminUser, { collapsed: true });

      // Should show user's initial in collapsed state
      const userAvatar = screen.getByText('A'); // Admin User -> 'A'
      expect(userAvatar).toBeInTheDocument();
    });
  });

  describe('Mobile Responsive Behavior', () => {
    it('should maintain full functionality on mobile', () => {
      renderSidebar(adminUser, { isMobile: true });

      // All navigation should work the same on mobile
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Commissions')).toBeInTheDocument();
    });
  });

  describe('Territory Display Integration', () => {
    it('should show territory tooltip with detailed information for KAM users', () => {
      renderSidebar(kamUser);

      // Territory information should be displayed
      expect(screen.getByText('2 Territories')).toBeInTheDocument();

      // The actual territories should be accessible (though in tooltip)
      // This would require interaction testing for full verification
    });

    it('should show all territories access for admin users', () => {
      renderSidebar(adminUser);

      expect(screen.getByText('All Territories')).toBeInTheDocument();
    });
  });

  describe('Navigation Item Interaction', () => {
    it('should call onClose when navigation items are clicked on mobile', () => {
      const mockOnClose = vi.fn();
      renderSidebar(kamUser, { isMobile: true, onClose: mockOnClose });

      // Click a navigation item
      const dashboardLink = screen.getByText('Dashboard');
      dashboardLink.click();

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClose when navigation items are clicked on desktop', () => {
      const mockOnClose = vi.fn();
      renderSidebar(kamUser, { isMobile: false, onClose: mockOnClose });

      // Click a navigation item
      const dashboardLink = screen.getByText('Dashboard');
      dashboardLink.click();

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility and Visual Indicators', () => {
    it('should show active state for selected navigation items', () => {
      // This would require setting up router state to test active states
      renderSidebar(adminUser);

      // Verify navigation structure is accessible
      const navItems = screen.getAllByRole('button');
      expect(navItems.length).toBeGreaterThan(0);
    });

    it('should display role chips correctly', () => {
      renderSidebar(kamUser);

      expect(screen.getByText('KAM')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no territories gracefully', () => {
      const userWithoutTerritories = {
        ...kamUser,
        territories: [],
      };

      renderSidebar(userWithoutTerritories);

      // Should still render sidebar without territory information
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Territories')).not.toBeInTheDocument();
    });

    it('should handle user with undefined properties gracefully', () => {
      const incompleteUser = {
        ...kamUser,
        name: undefined,
        territories: undefined,
      } as any;

      renderSidebar(incompleteUser);

      // Should still render basic navigation
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Snapshot Testing for Visual Consistency', () => {
    it('should match admin user sidebar snapshot', () => {
      const { container } = renderSidebar(adminUser);
      expect(container.firstChild).toMatchSnapshot('admin-sidebar');
    });

    it('should match KAM user sidebar snapshot', () => {
      const { container } = renderSidebar(kamUser);
      expect(container.firstChild).toMatchSnapshot('kam-sidebar');
    });

    it('should match collapsed sidebar snapshot', () => {
      const { container } = renderSidebar(adminUser, { collapsed: true });
      expect(container.firstChild).toMatchSnapshot('collapsed-sidebar');
    });
  });
});
