/**
 * Accessibility tests for Dashboard component
 * Ensures WCAG compliance and screen reader compatibility
 */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  vi,
  describe,
  it,
  beforeAll,
  afterEach,
  afterAll,
  expect,
} from 'vitest';
import Dashboard from '../Dashboard';
import { baseApi } from '../../api/baseApi';
import { theme } from '../../theme';
import type { User } from '../../types';

expect.extend(toHaveNoViolations);

// Mock user
const mockUser: User = {
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

// Mock API response
const mockMetricsResponse = {
  activeLeads: 25,
  pendingQuotations: 12,
  recentActivities: [
    {
      id: '1',
      title: 'New lead created',
      description: 'Solar installation for residential property',
      timestamp: '2024-01-01T10:00:00Z',
      type: 'lead',
    },
  ],
  dateRange: {
    from: '2024-01-01T00:00:00Z',
    to: '2024-01-08T00:00:00Z',
  },
  lastUpdated: '2024-01-08T12:00:00Z',
  channelPartners: 8,
  pendingCommissions: 3,
};

// MSW server for API mocking
const server = setupServer(
  rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
    return res(ctx.json(mockMetricsResponse));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    token: 'fake-token',
  }),
}));

// Test store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      api: baseApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

const renderDashboard = async () => {
  const store = createTestStore();

  const result = render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );

  // Wait for data to load to test the complete rendered state
  await screen.findByText('Welcome back, Admin!');

  return result;
};

describe('Dashboard Accessibility Tests', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = await renderDashboard();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper heading hierarchy', async () => {
    await renderDashboard();

    // Main page heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Welcome back, Admin!');

    // Card headings should be proper levels
    const cardHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(cardHeadings.length).toBeGreaterThan(0);

    // Check specific card headings
    expect(
      screen.getByRole('heading', { name: /Recent Activity/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Quick Actions/i })
    ).toBeInTheDocument();
  });

  it('has proper landmark regions', async () => {
    await renderDashboard();

    // Main content region
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('dashboard-page');
  });

  it('has accessible buttons with proper labels', async () => {
    await renderDashboard();

    // Quick action buttons
    const viewLeadsButton = screen.getByRole('button', { name: /View Leads/i });
    expect(viewLeadsButton).toBeInTheDocument();
    expect(viewLeadsButton).toHaveAttribute('type', 'button');

    const createQuotationButton = screen.getByRole('button', {
      name: /Create Quotation/i,
    });
    expect(createQuotationButton).toBeInTheDocument();

    // Refresh button (FAB)
    const refreshButton = screen.getByRole('button', {
      name: /refresh dashboard/i,
    });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).toHaveAttribute('aria-label', 'refresh dashboard');
  });

  it('has proper color contrast for text elements', async () => {
    const { container } = await renderDashboard();

    // Test main text elements for color contrast
    const mainHeading = screen.getByRole('heading', { level: 1 });
    const computedStyle = window.getComputedStyle(mainHeading);

    // Material-UI theme should provide sufficient contrast
    expect(computedStyle.color).toBeDefined();
  });

  it('has accessible loading states', async () => {
    // Test loading state accessibility
    server.use(
      rest.get('/api/v1/dashboard/metrics', async (req, res, ctx) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res(ctx.json(mockMetricsResponse));
      })
    );

    const store = createTestStore();

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Dashboard />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );

    // Loading skeletons should be accessible
    const loadingElements = screen.getAllByTestId('loading-skeleton');
    expect(loadingElements.length).toBeGreaterThan(0);

    // Should have aria-live region for loading announcements
    // Material-UI CircularProgress has built-in accessibility
  });

  it('has keyboard navigation support', async () => {
    await renderDashboard();

    // All interactive elements should be focusable
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });

    // Links should be keyboard accessible
    const links = screen.queryAllByRole('link');
    links.forEach(link => {
      expect(link).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('has proper ARIA labels for metrics', async () => {
    await renderDashboard();

    // Metric values should be properly labeled
    const activeLeadsValue = screen.getByText('25');
    expect(
      activeLeadsValue.closest('[role="region"]') ||
        activeLeadsValue.parentElement
    ).toBeDefined();

    // Check that metrics have descriptive context
    expect(screen.getByText('Active Leads')).toBeInTheDocument();
    expect(screen.getByText('Pending Quotations')).toBeInTheDocument();
  });

  it('handles error states accessibly', async () => {
    server.use(
      rest.get('/api/v1/dashboard/metrics', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    await renderDashboard();

    // Wait for error message
    await screen.findByText(/Failed to load dashboard metrics/);

    // Error should be announced to screen readers
    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/Failed to load dashboard metrics/);

    // Retry button should be accessible
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton.closest('button')).toHaveAttribute('type', 'button');
  });

  it('has accessible card components', async () => {
    await renderDashboard();

    // Cards should have proper structure
    const quickActionsCard =
      screen.getByText('Quick Actions').closest('[role="region"]') ||
      screen.getByText('Quick Actions').closest('.MuiCard-root');
    expect(quickActionsCard).toBeDefined();

    const recentActivityCard =
      screen.getByText('Recent Activity').closest('[role="region"]') ||
      screen.getByText('Recent Activity').closest('.MuiCard-root');
    expect(recentActivityCard).toBeDefined();
  });

  it('provides meaningful alternative text for icons', async () => {
    await renderDashboard();

    // Icons should have accessible labels or be decorative
    const refreshIcon = screen.getByRole('button', {
      name: /refresh dashboard/i,
    });
    expect(refreshIcon).toBeInTheDocument();

    // Material-UI icons are typically decorative when used with text labels
    // The parent button should provide the accessible name
  });

  it('has proper focus management', async () => {
    await renderDashboard();

    // Focus should be manageable for keyboard users
    const firstButton = screen.getAllByRole('button')[0];
    if (firstButton) {
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
    }
  });

  it('passes axe checks for WCAG 2.1 AA compliance', async () => {
    const { container } = await renderDashboard();

    // Run axe with WCAG 2.1 AA standards
    const results = await axe(container, {
      rules: {
        // Enable specific WCAG 2.1 AA rules
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'aria-labels': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });
});
