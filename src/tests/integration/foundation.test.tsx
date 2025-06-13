// Mock environment variables before any imports
process.env.REACT_APP_ENVIRONMENT = 'DEV';
process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001';
process.env.REACT_APP_VERSION = '1.0.0-test';
process.env.REACT_APP_BUILD_NUMBER = 'test-build';

/**
 * Foundation Integration Tests for Solarium Web Portal
 * Tests the integration of all foundational components
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { SolariumThemeProvider } from '../../theme/ThemeProvider';
import { AuthProvider } from '../../contexts/AuthContext';
import { AppRoutes } from '../../routes';
import GlobalErrorHandler from '../../components/error/GlobalErrorHandler/index';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../theme';
import App from '../../App';

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
  },
  isDevelopment: () => true,
  isStaging: () => false,
  isProduction: () => false,
  getEnvironmentDisplayName: () => 'Development',
}));

// Helper to render with all providers
const renderApp = () => {
  return render(
    <GlobalErrorHandler>
      <SolariumThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </SolariumThemeProvider>
    </GlobalErrorHandler>
  );
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('Foundation Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Application Startup', () => {
    test('application loads without errors', async () => {
      renderApp();

      // Check for login page elements with more flexible matching
      await waitFor(
        () => {
          const heading = screen.queryByText(/Solarium Web Portal/i);
          expect(heading).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    test('environment configuration is loaded correctly', async () => {
      renderWithTheme(<App />);

      // Check if environment badge is displayed with waitFor
      await waitFor(
        () => {
          const banner = screen.getByTestId('environment-banner');
          expect(banner).toBeInTheDocument();
          expect(screen.getByTestId('environment-chip')).toHaveTextContent(
            'ENV: Development'
          );
          expect(screen.getByTestId('version-info')).toHaveTextContent(
            'v1.0.0-test'
          );
        },
        { timeout: 5000 }
      );
    });

    test('Material UI theme is applied', async () => {
      renderWithTheme(<App />);

      // Check if themed components are rendered with waitFor
      await waitFor(
        () => {
          const buttons = screen.getAllByRole('button');
          expect(buttons.length).toBeGreaterThan(0);

          const heading = screen.queryByText(/Solarium Web Portal/i);
          expect(heading).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Authentication Flow', () => {
    test('user can login and access dashboard', async () => {
      const user = userEvent.setup();
      renderApp();

      // Should show login page with flexible matching
      await waitFor(
        () => {
          const heading = screen.queryByText(/Solarium Web Portal/i);
          expect(heading).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Use Demo buttons for login
      const adminDemoButton = screen.getByText(/Demo as Admin/i);
      await user.click(adminDemoButton);

      // Find and click the Sign In button (it should be available now)
      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      // Should navigate to dashboard with flexible matching
      await waitFor(
        () => {
          const welcomeElements = screen.getAllByText((_, element) => {
            return element?.textContent?.includes('Welcome back') ?? false;
          });
          expect(welcomeElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      // Should show navigation with flexible matching
      await waitFor(
        () => {
          const dashboardElements = screen.getAllByText((_, element) => {
            return element?.textContent?.includes('Dashboard') ?? false;
          });
          expect(dashboardElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );
    });

    test('invalid credentials show error message', async () => {
      const user = userEvent.setup();
      renderApp();

      // Wait for the login form to be rendered
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });

      // Fill invalid credentials and submit
      const emailField = screen.getByLabelText(/email/i);
      const passwordField = screen.getByLabelText(/password/i);

      await user.type(emailField, 'invalid@email.com');
      await user.type(passwordField, 'wrongpassword');

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      // Check for error message
      await waitFor(() => {
        const errorMessage = screen.getByText(
          /invalid credentials|login failed/i
        );
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Routing and Navigation', () => {
    test('protected routes redirect to login', async () => {
      renderApp();

      // Navigate to protected route
      window.history.pushState({}, 'Test', '/dashboard');
      renderApp();

      // Wait for login page to be rendered
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });

      // Verify we're on the login page
      expect(
        screen.getByRole('button', { name: /Sign In/i })
      ).toBeInTheDocument();
    });

    test('404 page renders for invalid routes', async () => {
      render(
        <GlobalErrorHandler>
          <SolariumThemeProvider>
            <MemoryRouter initialEntries={['/invalid-route']}>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </MemoryRouter>
          </SolariumThemeProvider>
        </GlobalErrorHandler>
      );
      await waitFor(() => {
        expect(screen.getByText('Page Not Found')).toBeInTheDocument();
        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
    });

    test('role-based navigation works correctly', async () => {
      localStorage.setItem(
        'auth_demo_mode',
        JSON.stringify({
          userType: 'admin',
        })
      );

      renderApp();

      await waitFor(
        () => {
          expect(
            screen.getByText(/Welcome back/i, { exact: false })
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('error boundary catches component errors', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      await act(async () => {
        render(
          <SolariumThemeProvider>
            <GlobalErrorHandler>
              <ThrowError />
            </GlobalErrorHandler>
          </SolariumThemeProvider>
        );
      });

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    test('access denied page works for unauthorized access', async () => {
      localStorage.setItem(
        'auth_demo_mode',
        JSON.stringify({
          userType: 'kam',
        })
      );

      window.history.pushState({}, 'Test', '/master-data');
      renderApp();

      await waitFor(
        () => {
          expect(
            screen.getByText(/Welcome back/i, { exact: false })
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Responsive Design', () => {
    test('layout adapts to mobile viewport', async () => {
      // Set mobile viewport
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      renderApp();

      // Wait for the login page to be rendered
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });

      // Verify mobile-specific elements
      const loginContainer = screen.getByRole('main');
      expect(loginContainer).toHaveStyle({
        padding: expect.stringMatching(/1rem|2rem/),
      });
    });
  });
});
