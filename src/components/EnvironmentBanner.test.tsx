/**
 * Test suite for EnvironmentBanner component
 * Tests environment banner display and interactions
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../theme';
import EnvironmentBanner from './EnvironmentBanner';
import * as environmentConfig from '../config/environment';

// Mock environment config
jest.mock('../config/environment', () => ({
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

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('EnvironmentBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display environment information correctly', () => {
    renderWithTheme(<EnvironmentBanner />);

    const banner = screen.getByTestId('environment-banner');
    expect(banner).toBeInTheDocument();
    expect(screen.getByTestId('environment-chip')).toHaveTextContent(
      'ENV: Development'
    );
    expect(screen.getByTestId('version-info')).toHaveTextContent('v1.0.0-test');
  });

  test('should expand and display build information when info button is clicked', () => {
    renderWithTheme(<EnvironmentBanner />);

    const infoButton = screen.getByTestId('info-button');
    fireEvent.click(infoButton);

    const expandedInfo = screen.getByTestId('expanded-info');
    expect(expandedInfo).toBeVisible();
    expect(screen.getByTestId('build-info')).toHaveTextContent('test-build');
    expect(screen.getByTestId('api-info')).toHaveTextContent(
      'http://localhost:3001'
    );
    expect(screen.getByTestId('session-info')).toHaveTextContent('30min');
  });

  test('should dismiss banner when close button is clicked', () => {
    renderWithTheme(<EnvironmentBanner />);

    const dismissButton = screen.getByTestId('dismiss-button');
    fireEvent.click(dismissButton);

    expect(screen.queryByTestId('environment-banner')).not.toBeInTheDocument();
  });

  test('should display debug indicator when debug tools are enabled', () => {
    renderWithTheme(<EnvironmentBanner />);

    const infoButton = screen.getByTestId('info-button');
    fireEvent.click(infoButton);

    const expandedInfo = screen.getByTestId('expanded-info');
    expect(expandedInfo).toBeVisible();
    expect(screen.getByTestId('debug-info')).toHaveTextContent('Enabled');
  });

  test('should not render in production environment', () => {
    // Override the mock for this test
    jest.spyOn(environmentConfig, 'isDevelopment').mockReturnValue(false);
    jest.spyOn(environmentConfig, 'isStaging').mockReturnValue(false);
    jest.spyOn(environmentConfig, 'isProduction').mockReturnValue(true);

    renderWithTheme(<EnvironmentBanner />);
    expect(screen.queryByTestId('environment-banner')).not.toBeInTheDocument();
  });
});
