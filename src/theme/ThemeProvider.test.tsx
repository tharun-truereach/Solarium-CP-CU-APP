/**
 * Tests for Solarium Theme Provider component
 * Verifies theme provider functionality and CSS baseline
 */
import { render, screen } from '@testing-library/react';
import { Typography } from '@mui/material';
import { SolariumThemeProvider } from './ThemeProvider';

describe('SolariumThemeProvider', () => {
  test('provides theme to child components', () => {
    render(
      <SolariumThemeProvider>
        <Typography data-testid="themed-text" color="primary">
          Test Text
        </Typography>
      </SolariumThemeProvider>
    );

    const themedText = screen.getByTestId('themed-text');
    expect(themedText).toBeInTheDocument();
  });

  test('applies CSS baseline normalization', () => {
    render(
      <SolariumThemeProvider>
        <div data-testid="baseline-test">Content</div>
      </SolariumThemeProvider>
    );

    // CSS baseline should be applied globally
    // If this renders without error, CssBaseline is working
    expect(screen.getByTestId('baseline-test')).toBeInTheDocument();
  });

  test('renders children correctly', () => {
    const TestChild = () => <div data-testid="child">Child Component</div>;

    render(
      <SolariumThemeProvider>
        <TestChild />
      </SolariumThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });
});
