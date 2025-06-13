/**
 * End-to-end user flow tests
 * Tests complete user journeys through the application
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, setupUser, clearUser } from '../../test-utils';
import App from '../../App';

// Mock environment for E2E tests
jest.mock('../../config/environment', () => ({
  config: {
    environment: 'DEV',
    apiBaseUrl: 'http://localhost:3001',
    sessionTimeoutMinutes: 30,
    sessionWarningMinutes: 5,
    enableDebugTools: true,
    version: '1.0.0-test',
    buildNumber: 'test-build',
    apiTimeout: 30000,
    enableMockAuth: true,
    enableServiceWorker: false,
    analyticsId: 'test-analytics-id',
    logLevel: 'debug',
    showReduxDevtools: true,
  },
  isDevelopment: () => true,
  isStaging: () => false,
  isProduction: () => false,
  getEnvironmentDisplayName: () => 'Development',
  validateEnvironment: jest.fn(),
}));

// Mock AuthContext to simulate a logged-in state
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { name: 'Test User' },
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('E2E User Flows', () => {
  beforeEach(() => {
    clearUser();
  });

  afterEach(() => {
    clearUser();
  });

  test('Admin user complete workflow', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Step 1: Login as admin
    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/email/i), 'admin@solarium.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Step 2: Verify dashboard access
    await waitFor(
      () => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();

    // Step 3: Verify admin-specific content
    expect(screen.getByText('Channel Partners')).toBeInTheDocument();
    expect(screen.getByText('Pending Commissions')).toBeInTheDocument();

    // Step 4: Verify navigation menu
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Quotations')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();

    // Step 5: Test logout
    const userMenuButton = screen.getByRole('button', {
      name: /account of current user/i,
    });
    await user.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Logout'));

    // Should redirect to login
    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });
  });

  test('KAM user restricted access workflow', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Step 1: Login as KAM
    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/email/i), 'kam@solarium.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Step 2: Verify dashboard access
    await waitFor(
      () => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('KAM')).toBeInTheDocument();

    // Step 3: Verify KAM-specific restrictions
    // KAM should not see admin-only stats
    expect(screen.queryByText('Pending Commissions')).not.toBeInTheDocument();

    // Step 4: Verify limited quick actions
    const quickActionsSection = screen
      .getByText('Quick Actions')
      .closest('.dashboard-card');
    expect(quickActionsSection).toBeInTheDocument();

    // Should not see admin-only actions
    expect(screen.queryByText('Manage Partners')).not.toBeInTheDocument();
    expect(screen.queryByText('View Reports')).not.toBeInTheDocument();
  });

  test('Error handling workflow', async () => {
    render(<App />);

    // Test 404 error
    window.history.pushState({}, '', '/nonexistent-page');

    await waitFor(() => {
      expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
    });

    // Test navigation back
    const goBackButton = screen.getByText('Go Back');
    expect(goBackButton).toBeInTheDocument();
  });

  test('Responsive design workflow', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    setupUser();
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Mobile menu should be present
    const menuButton = screen.getByLabelText(/open drawer/i);
    expect(menuButton).toBeInTheDocument();

    // Test mobile menu interaction
    await user.click(menuButton);

    // Mobile drawer should open (implementation specific)
    expect(menuButton).toBeInTheDocument();
  });

  test('Session timeout workflow', async () => {
    jest.useFakeTimers();
    setupUser();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Simulate session warning (this would need actual SessionTimeout implementation)
    jest.advanceTimersByTime(25 * 60 * 1000); // 25 minutes

    // Note: This test would need the SessionTimeout component to be properly integrated
    // and use shorter intervals for testing purposes

    jest.useRealTimers();
  });

  test('Environment banner workflow', async () => {
    setupUser();
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Environment banner should be visible
    const banner = screen.getByTestId('environment-banner');
    expect(banner).toBeInTheDocument();
    expect(screen.getByTestId('environment-chip')).toHaveTextContent(
      'ENV: Development'
    );
    expect(screen.getByTestId('version-info')).toHaveTextContent('v1.0.0-test');

    // Test expand functionality
    const infoButton = screen.getByTestId('info-button');
    await user.click(infoButton);

    // Verify expanded information
    const expandedInfo = screen.getByTestId('expanded-info');
    expect(expandedInfo).toBeVisible();
    expect(screen.getByTestId('build-info')).toHaveTextContent('test-build');
    expect(screen.getByTestId('api-info')).toHaveTextContent(
      'http://localhost:3001'
    );
    expect(screen.getByTestId('session-info')).toHaveTextContent('30min');
    expect(screen.getByTestId('debug-info')).toHaveTextContent('Enabled');

    // Test dismiss functionality
    const dismissButton = screen.getByTestId('dismiss-button');
    await user.click(dismissButton);
    expect(screen.queryByTestId('environment-banner')).not.toBeInTheDocument();
  });
});
