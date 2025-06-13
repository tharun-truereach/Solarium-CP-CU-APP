/**
 * Material UI Theme Configuration for Solarium Web Portal
 * Defines colors, typography, breakpoints, and component overrides
 */
import { createTheme, ThemeOptions } from '@mui/material/styles';

// Solarium brand colors
const colors = {
  primary: {
    main: '#059669', // Green primary
    light: '#10b981',
    dark: '#047857',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#6b7280', // Gray secondary
    light: '#9ca3af',
    dark: '#374151',
    contrastText: '#ffffff',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
  },
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
  },
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
  },
};

// Custom breakpoints for responsive design
const breakpoints = {
  values: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536,
  },
};

// Typography configuration
const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontSize: '2.5rem',
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
};

// Component overrides
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 8,
        padding: '10px 20px',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-1px)',
        },
      },
      containedPrimary: {
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        '&:hover': {
          background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #f1f5f9',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRadius: 0,
        borderRight: '1px solid #e2e8f0',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#ffffff',
        color: '#1f2937',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e2e8f0',
      },
    },
  },
};

// Theme configuration object
const themeOptions: ThemeOptions = {
  palette: colors,
  breakpoints,
  typography,
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: components as any,
};

// Create and export the theme
export const theme = createTheme(themeOptions);

// Type augmentation for custom breakpoints
declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    xxl: true;
  }
}

// Export individual theme parts for reuse
export { colors, breakpoints, typography };

// Theme helper functions
export const getResponsiveValue = (
  xs: number | string,
  sm?: number | string,
  md?: number | string,
  lg?: number | string,
  xl?: number | string
) => ({
  xs,
  ...(sm && { sm }),
  ...(md && { md }),
  ...(lg && { lg }),
  ...(xl && { xl }),
});

// Environment-based theme badge colors
export const getEnvironmentBadgeColor = (environment: string) => {
  switch (environment.toUpperCase()) {
    case 'DEVELOPMENT':
      return colors.warning.main;
    case 'STAGING':
      return colors.info.main;
    case 'PRODUCTION':
      return colors.error.main;
    default:
      return colors.text.secondary;
  }
};
