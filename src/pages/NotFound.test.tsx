/**
 * Test suite for NotFound page component
 * Tests navigation, responsive behavior, and user interactions
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import NotFound from './NotFound';
import { theme } from '../theme';

const renderWithProviders = (initialEntries: string[] = ['/404']) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <NotFound />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
};

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('NotFound', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders 404 error message', () => {
    renderWithProviders();

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(
      screen.getByText(/The page you're looking for doesn't exist/)
    ).toBeInTheDocument();
  });

  test('shows correct navigation buttons for authenticated user', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      role: 'admin' as const,
      name: 'Test Admin',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });
  });

  test('shows correct navigation buttons for unauthenticated user', async () => {
    localStorage.clear();

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Go Home')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });
  });

  test('handles go back navigation', () => {
    renderWithProviders();

    fireEvent.click(screen.getByText('Go Back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('displays help text', () => {
    renderWithProviders();

    expect(
      screen.getByText(/If you believe this is an error/)
    ).toBeInTheDocument();
  });
});
