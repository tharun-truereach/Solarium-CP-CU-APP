/**
 * Tests for Material UI theme configuration
 * Verifies theme values and helper functions
 */
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import { theme, getEnvironmentBadgeColor, getResponsiveValue } from './index';

describe('Solarium Theme', () => {
  test('theme has correct primary colors', () => {
    expect(theme.palette.primary.main).toBe('#059669');
    expect(theme.palette.primary.light).toBe('#10b981');
    expect(theme.palette.primary.dark).toBe('#047857');
  });

  test('theme has correct secondary colors', () => {
    expect(theme.palette.secondary.main).toBe('#6b7280');
    expect(theme.palette.secondary.light).toBe('#9ca3af');
    expect(theme.palette.secondary.dark).toBe('#374151');
  });

  test('theme has correct breakpoints', () => {
    expect(theme.breakpoints.values.xs).toBe(0);
    expect(theme.breakpoints.values.sm).toBe(640);
    expect(theme.breakpoints.values.md).toBe(768);
    expect(theme.breakpoints.values.lg).toBe(1024);
    expect(theme.breakpoints.values.xl).toBe(1280);
  });

  test('theme has correct typography settings', () => {
    expect(theme.typography.h1.fontSize).toBe('2.5rem');
    expect(theme.typography.h1.fontWeight).toBe(600);
    expect(
      (
        theme.components?.MuiButton?.styleOverrides?.root as {
          textTransform?: string;
        }
      )?.textTransform
    ).toBe('none');
  });

  test('theme applies to components correctly', () => {
    const TestComponent = () => (
      <ThemeProvider theme={theme}>
        <Box data-testid="themed-box" sx={{ color: 'primary.main' }}>
          Test
        </Box>
      </ThemeProvider>
    );

    render(<TestComponent />);
    // If this renders without error, theme integration is working
  });
});

describe('Theme Helper Functions', () => {
  test('getEnvironmentBadgeColor returns correct colors', () => {
    expect(getEnvironmentBadgeColor('DEVELOPMENT')).toBe('#f59e0b');
    expect(getEnvironmentBadgeColor('STAGING')).toBe('#3b82f6');
    expect(getEnvironmentBadgeColor('PRODUCTION')).toBe('#ef4444');
    expect(getEnvironmentBadgeColor('UNKNOWN')).toBe('#6b7280');
  });

  test('getEnvironmentBadgeColor is case insensitive', () => {
    expect(getEnvironmentBadgeColor('development')).toBe('#f59e0b');
    expect(getEnvironmentBadgeColor('staging')).toBe('#3b82f6');
    expect(getEnvironmentBadgeColor('production')).toBe('#ef4444');
  });

  test('getResponsiveValue creates correct responsive object', () => {
    const result = getResponsiveValue('100%', '80%', '60%', '40%', '20%');
    expect(result).toEqual({
      xs: '100%',
      sm: '80%',
      md: '60%',
      lg: '40%',
      xl: '20%',
    });
  });

  test('getResponsiveValue handles partial values', () => {
    const result = getResponsiveValue('100%', '80%');
    expect(result).toEqual({
      xs: '100%',
      sm: '80%',
    });
  });
});
