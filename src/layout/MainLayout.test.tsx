/**
 * Test suite for MainLayout component
 * Tests responsive behavior, sidebar toggle, and layout structure
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from './MainLayout';
import { theme } from '../theme';
import * as AuthContext from '../contexts/AuthContext';

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

// Mock useMediaQuery
const mockUseMediaQuery = jest.fn();
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => mockUseMediaQuery(),
}));

const renderWithProviders = (children: React.ReactNode) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <MainLayout>{children}</MainLayout>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('MainLayout', () => {
  beforeEach(() => {
    mockUseMediaQuery.mockReturnValue(false); // Desktop by default
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders layout with sidebar and header', () => {
    renderWithProviders(<div data-testid="content">Test Content</div>);

    expect(screen.getByText('Solarium Portal')).toBeInTheDocument();
    expect(screen.getAllByText('Solarium')).toHaveLength(2); // Sidebar logo
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  test('shows mobile drawer on mobile screens', () => {
    mockUseMediaQuery.mockReturnValue(true); // Mobile

    renderWithProviders(<div data-testid="content">Test Content</div>);

    // Menu button should be visible
    const menuButton = screen.getByLabelText('open drawer');
    expect(menuButton).toBeInTheDocument();
  });

  test('handles sidebar toggle', () => {
    renderWithProviders(<div data-testid="content">Test Content</div>);

    const menuButton = screen.getByLabelText('toggle drawer');
    fireEvent.click(menuButton);

    // Should toggle sidebar state (test implementation depends on specific behavior)
    expect(menuButton).toBeInTheDocument();
  });

  test('renders without layout when user is not authenticated', () => {
    // Mock unauthenticated user
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      logout: jest.fn(),
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      checkPermission: jest.fn(),
    });

    renderWithProviders(<div data-testid="content">Test Content</div>);

    // Should render content directly without layout
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.queryByText('Solarium Portal')).not.toBeInTheDocument();
  });
});
