/**
 * Test suite for ServerError page component
 * Tests server error display and recovery options
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ServerError from './ServerError';
import { theme } from '../theme';

const renderWithProviders = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <AuthProvider>
          <ServerError {...props} />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
};

const mockNavigate = jest.fn();
const mockReload = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
});

describe('ServerError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders server error message', () => {
    renderWithProviders();

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Server Error')).toBeInTheDocument();
    expect(
      screen.getByText(/We're experiencing technical difficulties/)
    ).toBeInTheDocument();
  });

  test('displays error details when provided', () => {
    const testError = new Error('Test error message');
    const errorId = 'ERR-12345';

    renderWithProviders({ error: testError, errorId });

    expect(screen.getByText(`Error ID: ${errorId}`)).toBeInTheDocument();
    expect(
      screen.getByText(`Details: ${testError.message}`)
    ).toBeInTheDocument();
  });

  test('handles try again button', () => {
    renderWithProviders();

    fireEvent.click(screen.getByText('Try Again'));
    expect(mockReload).toHaveBeenCalled();
  });

  test('handles go home button for authenticated user', () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      role: 'admin' as const,
      name: 'Test User',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));

    renderWithProviders();

    fireEvent.click(screen.getByText('Go to Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('handles go home button for unauthenticated user', () => {
    localStorage.clear();

    renderWithProviders();

    fireEvent.click(screen.getByText('Go Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('handles report issue button', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    renderWithProviders();

    fireEvent.click(screen.getByText('Report Issue'));

    expect(consoleSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
