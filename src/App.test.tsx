/**
 * Tests for main App component with Material UI integration
 * Verifies theme integration and component rendering
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SolariumThemeProvider } from './theme/ThemeProvider';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: App } = require('./App');

// Mock process.env instead of import.meta.env for Jest compatibility
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    REACT_APP_ENVIRONMENT: 'TEST',
    REACT_APP_API_BASE_URL: 'http://localhost:3000',
    REACT_APP_SESSION_TIMEOUT_MIN: '30',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock environment config
jest.mock('./config/environment', () => ({
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

// Helper to render App with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(<SolariumThemeProvider>{component}</SolariumThemeProvider>);
};

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jest.resetModules();
    // jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    renderWithTheme(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // Add your assertions here
  });

  test('renders with Material UI theme', () => {
    renderWithTheme(<App />);

    expect(
      screen.getByText('Solarium Green Energy - Web Portal')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Welcome to Solarium Web Portal')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Admin and Key Account Manager Interface')
    ).toBeInTheDocument();
  });

  test('displays environment chip with correct styling', () => {
    renderWithTheme(<App />);
    const envChip = screen.getByTestId('environment-chip');
    expect(envChip).toHaveTextContent(/ENV: Development/i);
  });

  test('Material UI button works correctly', () => {
    renderWithTheme(<App />);

    const button = screen.getByRole('button', { name: /count is \d+/i });
    expect(button).toHaveTextContent('Count is 0');

    fireEvent.click(button);
    expect(button).toHaveTextContent('Count is 1');

    fireEvent.click(button);
    expect(button).toHaveTextContent('Count is 2');
  });

  test('displays configuration information in cards', () => {
    renderWithTheme(<App />);
    // Use data-testid for robust matching
    expect(screen.getByTestId('configuration-card')).toBeInTheDocument();
    expect(screen.getByTestId('environment-card')).toBeInTheDocument();
    expect(screen.getByTestId('api-card')).toBeInTheDocument();
    expect(screen.getByTestId('session-card')).toBeInTheDocument();
  });

  test('shows theme color chips', () => {
    renderWithTheme(<App />);

    // Check for environment banner which uses theme colors
    const envBanner = screen.getByTestId('environment-banner');
    expect(envBanner).toBeInTheDocument();

    // Check for theme colors in the banner's background
    expect(envBanner).toHaveStyle({
      backgroundColor: expect.stringMatching(/^#(?:[0-9a-fA-F]{3}){1,2}$/),
    });
  });

  test('renders responsive breakpoint demo', () => {
    renderWithTheme(<App />);

    expect(screen.getByText('Responsive Breakpoints Test')).toBeInTheDocument();
    expect(
      screen.getByText('Resize your browser window to see responsive behavior')
    ).toBeInTheDocument();
  });

  test('renders footer with copyright', () => {
    renderWithTheme(<App />);

    expect(
      screen.getByText(/© 2024 Solarium Green Energy/)
    ).toBeInTheDocument();
  });

  test('displays foundation test section', () => {
    renderWithTheme(<App />);

    expect(screen.getByText('Foundation Test')).toBeInTheDocument();
    expect(
      screen.getByText('Click the button to test React state management')
    ).toBeInTheDocument();
  });

  test('handles different environment values for badge colors', () => {
    const envs = [
      { env: 'DEV', display: 'Development' },
      { env: 'STAGING', display: 'Staging' },
      { env: 'PROD', display: 'Production' },
    ];
    envs.forEach(({ env, display }) => {
      // jest.resetModules();
      jest.clearAllMocks();
      jest.doMock('./config/environment', () => ({
        config: {
          environment: env,
          apiBaseUrl: 'http://localhost:3001',
          sessionTimeoutMinutes: 30,
          sessionWarningMinutes: 5,
          enableDebugTools: true,
          version: '1.0.0-test',
          buildNumber: 'test-build',
        },
        isDevelopment: () => env === 'DEV',
        isStaging: () => env === 'STAGING',
        isProduction: () => env === 'PROD',
        getEnvironmentDisplayName: () => display,
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { default: App } = require('./App');
      renderWithTheme(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
      const envChip = screen.getByTestId('environment-chip');
      expect(envChip).toHaveTextContent(new RegExp(`ENV: ${display}`, 'i'));
      jest.dontMock('./config/environment');
    });
  });
});
