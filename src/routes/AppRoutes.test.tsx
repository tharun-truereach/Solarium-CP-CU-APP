/**
 * Test suite for AppRoutes component
 * Tests routing configuration and protected routes
 */
import { screen, waitFor, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import AppRoutes from './AppRoutes';
import { theme } from '../theme';
import { ROUTES } from './routes';
import { clearUser } from '../test-utils';
import userEvent from '@testing-library/user-event';

// Mock auth context
const mockUser = {
  id: '1',
  email: 'admin@test.com',
  role: 'admin' as const,
  name: 'Test Admin',
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: jest.fn(),
  }),
}));

const renderWithProviders = (initialRoute = '/') => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('AppRoutes', () => {
  beforeEach(() => {
    clearUser();
  });

  afterEach(() => {
    clearUser();
  });

  test('redirects to dashboard from home route', async () => {
    const user = userEvent.setup();
    renderWithProviders(ROUTES.HOME);

    // Wait for login page first
    await waitFor(
      () => {
        const portalElements = screen.getAllByText((_, element) => {
          return element?.textContent?.includes('Solarium Web Portal') ?? false;
        });
        expect(portalElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );

    // Use Demo buttons for login
    const adminDemoButton = screen.getByText(/Demo as Admin/i);
    await user.click(adminDemoButton);

    // Find and click the Sign In button
    const signInButton = screen.getByRole('button', { name: /Sign In/i });
    await user.click(signInButton);

    // Then wait for dashboard with flexible matching
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

  test('renders login page for unauthenticated users', () => {
    renderWithProviders(ROUTES.LOGIN);
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  test('renders 404 page for invalid routes', async () => {
    renderWithProviders('/invalid-route');
    await waitFor(() => {
      expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
    });
  });

  test('renders access denied page for unauthorized access', async () => {
    const user = userEvent.setup();
    renderWithProviders(ROUTES.COMMISSIONS);

    // Wait for login page first
    await waitFor(
      () => {
        const portalElements = screen.getAllByText((_, element) => {
          return element?.textContent?.includes('Solarium Web Portal') ?? false;
        });
        expect(portalElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );

    // Use Demo buttons for login
    const kamDemoButton = screen.getByText(/Demo as KAM/i);
    await user.click(kamDemoButton);

    // Find and click the Sign In button
    const signInButton = screen.getByRole('button', { name: /Sign In/i });
    await user.click(signInButton);

    // Navigate to commissions page
    window.history.pushState({}, 'Test', '/commissions');

    // Then wait for access denied with flexible matching
    await waitFor(
      () => {
        const accessDeniedElements = screen.getAllByText((_, element) => {
          return element?.textContent?.includes('Access Denied') ?? false;
        });
        expect(accessDeniedElements.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });
});
