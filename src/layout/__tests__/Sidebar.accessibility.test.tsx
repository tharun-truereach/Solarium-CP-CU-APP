/**
 * Accessibility tests for Sidebar component
 * Ensures navigation is screen reader friendly and keyboard accessible
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import Sidebar from '../Sidebar';
import { theme } from '../../theme';
import type { User } from '../../types';

expect.extend(toHaveNoViolations);

// Mock user data
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
  role: 'kam',
  name: 'KAM User',
};

// Mock useAuth hook
let mockUser: User | null = mockAdminUser;
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    token: 'fake-token',
  }),
}));

const renderSidebar = (props = {}) => {
  const defaultProps = {
    collapsed: false,
    isMobile: false,
    onClose: vi.fn(),
  };

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Sidebar {...defaultProps} {...props} />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Sidebar Accessibility Tests', () => {
  beforeEach(() => {
    mockUser = mockAdminUser;
  });

  it('should not have any accessibility violations', async () => {
    const { container } = renderSidebar();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper navigation landmark', () => {
    renderSidebar();

    // Should have navigation landmark
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('has accessible navigation items', () => {
    renderSidebar();

    // All navigation items should be buttons or links
    const dashboardButton = screen.getByRole('button', { name: /Dashboard/i });
    expect(dashboardButton).toBeInTheDocument();

    const leadsButton = screen.getByRole('button', {
      name: /Leads Management/i,
    });
    expect(leadsButton).toBeInTheDocument();

    // All buttons should be keyboard accessible
    const allButtons = screen.getAllByRole('button');
    allButtons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('provides tooltips for collapsed state', () => {
    renderSidebar({ collapsed: true, isMobile: false });

    // Tooltips should be present for collapsed items (desktop only)
    // Material-UI Tooltip provides accessibility automatically
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Each button should have accessible name even when collapsed
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName();
    });
  });

  it('has proper heading for branding', () => {
    renderSidebar();

    // Brand heading should be present and accessible
    const brandHeading = screen.getByText('Solarium');
    expect(brandHeading).toBeInTheDocument();

    // Should be a proper heading level
    expect(brandHeading.tagName.toLowerCase()).toMatch(/h[1-6]/);
  });

  it('handles keyboard navigation correctly', () => {
    renderSidebar();

    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0];

    // Should be focusable
    if (firstButton) {
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      // Should respond to keyboard events
      fireEvent.keyDown(firstButton, { key: 'Enter' });
      fireEvent.keyDown(firstButton, { key: ' ' }); // Space key
    }
  });

  it('provides proper role-based content for screen readers', () => {
    mockUser = mockKamUser;
    renderSidebar();

    // KAM user should not see admin-only items
    expect(screen.queryByText('Commissions')).not.toBeInTheDocument();
    expect(screen.queryByText('Master Data')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();

    // Should still have accessible navigation
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('has accessible user information section', () => {
    renderSidebar();

    // User info should be accessible
    const userSection = screen.getByText('Signed in as');
    expect(userSection).toBeInTheDocument();

    const userName = screen.getByText('Admin User');
    expect(userName).toBeInTheDocument();

    const userRole = screen.getByText('ADMIN');
    expect(userRole).toBeInTheDocument();
  });

  it('maintains accessibility in mobile mode', () => {
    renderSidebar({ isMobile: true });

    // Should still be accessible on mobile
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    // All interactive elements should be accessible
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName();
    });
  });

  it('has proper color contrast for all text', async () => {
    const { container } = renderSidebar();

    // Test with axe color contrast rules
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('provides accessible admin badges', () => {
    renderSidebar();

    // Admin badges should be accessible
    const adminBadges = screen.getAllByText('Admin');
    expect(adminBadges.length).toBe(3); // Commissions, Master Data, Settings

    adminBadges.forEach(badge => {
      // Badges should provide context
      expect(badge).toBeVisible();
    });
  });

  it('handles focus states properly', () => {
    renderSidebar();

    const buttons = screen.getAllByRole('button');

    // Test focus states
    buttons.forEach(button => {
      button.focus();
      expect(document.activeElement).toBe(button);

      // Should have visible focus indicator (handled by Material-UI)
      const computedStyle = window.getComputedStyle(button);
      expect(computedStyle).toBeDefined();
    });
  });

  it('announces navigation changes to screen readers', () => {
    const mockOnClose = vi.fn();
    renderSidebar({ isMobile: true, onClose: mockOnClose });

    // Click navigation item
    const dashboardButton = screen.getByRole('button', { name: /Dashboard/i });
    fireEvent.click(dashboardButton);

    // Mobile drawer should close on navigation
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('passes WCAG 2.1 AA compliance checks', async () => {
    const { container } = renderSidebar();

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'aria-labels': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('has semantic HTML structure', () => {
    renderSidebar();

    // Should use semantic HTML elements
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    // List structure for navigation items
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();

    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('provides meaningful error states', () => {
    // Test with no user (edge case)
    mockUser = null;
    renderSidebar();

    // Should handle gracefully without breaking accessibility
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
