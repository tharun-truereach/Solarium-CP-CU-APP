/**
 * Integration tests for the complete application
 * Tests user flows and component interactions
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import App from '../../App';
import { AuthContextType } from '../../contexts/AuthContext';

// app-integration.test.tsx (top of file)
const MockLazyExample = () => <div>Lazy Example (mock)</div>;
MockLazyExample.displayName = 'MockLazyExample';

jest.mock('../../pages/LazyExample', () => MockLazyExample);

// Mock environment config
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

// Mock AuthContext to control authentication state explicitly
const mockAuthReturn: AuthContextType = {
  user: null,
  login: jest.fn() as jest.Mock,
  logout: jest.fn() as jest.Mock,
  isAuthenticated: false,
  isLoading: false,
  checkPermission: jest.fn(),
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthReturn,
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Move MockEnvironmentBanner out of jest.mock
const MockEnvironmentBanner = () => (
  <div data-testid="mock-environment-banner" />
);
MockEnvironmentBanner.displayName = 'MockEnvironmentBanner';

jest.mock('../../components/EnvironmentBanner', () => {
  return MockEnvironmentBanner;
});

const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@solarium.com',
    role: 'admin' as const,
    name: 'Admin User',
  },
  // Add other roles if needed
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Reset mockAuthReturn for each test
    mockAuthReturn.user = null;
    mockAuthReturn.isAuthenticated = false;
    mockAuthReturn.isLoading = false;
    (mockAuthReturn.login as jest.Mock).mockReset(); // Cast to jest.Mock before calling mockReset
    (mockAuthReturn.logout as jest.Mock).mockReset(); // Cast to jest.Mock before calling mockReset
  });

  afterEach(() => {
    // No explicit cleanup needed here as beforeEach handles reset
  });

  test('complete authentication flow', async () => {
    const user = userEvent.setup();
    // Simulate login success by updating mockAuthReturn when login is called
    (mockAuthReturn.login as jest.Mock).mockImplementation(
      async (email: string, password: string) => {
        if (email === 'admin@solarium.com' && password === 'password123') {
          mockAuthReturn.user = mockUsers.admin;
          mockAuthReturn.isAuthenticated = true;
        } else {
          mockAuthReturn.user = null;
          mockAuthReturn.isAuthenticated = false;
        }
      }
    );

    render(<App />);

    // Should show login page initially (because mockAuthReturn.user is null)
    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    // Fill in login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'admin@solarium.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Should navigate to dashboard after login (triggered by mockAuthReturn update)
    await waitFor(
      () => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify dashboard content
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  test('navigation between different pages', async () => {
    // Set up authenticated user before rendering App
    mockAuthReturn.user = mockUsers.admin;
    mockAuthReturn.isAuthenticated = true;

    render(<App />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Test navigation to different routes via URL
    // This would require more complex setup with router testing
    // For now, verify that navigation elements are present
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Quotations')).toBeInTheDocument();
    expect(screen.getByText('Channel Partners')).toBeInTheDocument();
  });

  test('error boundary functionality', async () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });

    render(
      <div>
        <ErrorComponent />
      </div>
    );

    // Error boundary should catch the error
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('responsive layout behavior', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 1024px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Set up authenticated user before rendering App
    mockAuthReturn.user = mockUsers.admin;
    mockAuthReturn.isAuthenticated = true;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // On mobile, the menu button should be visible
    const menuButton = screen.getByLabelText(/open drawer/i);
    expect(menuButton).toBeInTheDocument();
  });

  test('session timeout warning', async () => {
    jest.useFakeTimers();
    // Set up authenticated user before rendering App
    mockAuthReturn.user = mockUsers.admin;
    mockAuthReturn.isAuthenticated = true;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Fast forward to trigger session warning
    // This would need the SessionTimeout component to use shorter intervals for testing
    jest.advanceTimersByTime(25 * 60 * 1000); // Fast forward 25 minutes

    // Should show session warning dialog
    await waitFor(() => {
      expect(screen.queryByText(/session expiring soon/i)).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('environment banner display', async () => {
    // Set up authenticated user before rendering App
    mockAuthReturn.user = mockUsers.admin;
    mockAuthReturn.isAuthenticated = true;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Environment banner should be visible in development
    const banner = screen.getByTestId('environment-banner');
    expect(banner).toBeInTheDocument();
    expect(screen.getByTestId('environment-chip')).toHaveTextContent(
      'ENV: Development'
    );
    expect(screen.getByTestId('version-info')).toHaveTextContent('v1.0.0-test');

    // Test expand functionality
    const infoButton = screen.getByTestId('info-button');
    await userEvent.click(infoButton);

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
    await userEvent.click(dismissButton);
    expect(screen.queryByTestId('environment-banner')).not.toBeInTheDocument();
  });

  test('loading states during navigation', async () => {
    // Set up authenticated user before rendering App
    mockAuthReturn.user = mockUsers.admin;
    mockAuthReturn.isAuthenticated = true;

    render(<App />);

    // Initial loading should be handled gracefully
    // The loading states are tested in individual component tests
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Verify no loading spinners are stuck
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
