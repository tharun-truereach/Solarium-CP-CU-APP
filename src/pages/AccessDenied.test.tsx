/**
 * Test suite for AccessDenied page component
 * Tests access control, user context display, and navigation
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import AccessDenied from './AccessDenied';
import { theme } from '../theme';

const renderWithProviders = (initialEntries: string[] = ['/403']) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <AccessDenied />
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

describe('AccessDenied', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders 403 error message', () => {
    renderWithProviders();

    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/You don't have permission/)).toBeInTheDocument();
  });

  test('displays user context when authenticated', async () => {
    const mockUser = {
      id: '1',
      email: 'kam@test.com',
      role: 'kam' as const,
      name: 'Test KAM',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/Current User:/)).toBeInTheDocument();
      expect(screen.getByText(/Test KAM/)).toBeInTheDocument();
      expect(screen.getByText(/kam@test.com/)).toBeInTheDocument();
      expect(screen.getByText('KAM')).toBeInTheDocument();
    });
  });

  test('handles navigation buttons', () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      role: 'kam' as const,
      name: 'Test User',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    renderWithProviders();

    // Test go to dashboard
    fireEvent.click(screen.getByText('Go to Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');

    // Test go back
    fireEvent.click(screen.getByText('Go Back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('displays help text', () => {
    renderWithProviders();

    expect(
      screen.getByText(/If you need access to this page/)
    ).toBeInTheDocument();
  });
});
