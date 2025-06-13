/**
 * Test suite for SessionTimeout component
 * Tests session monitoring, warning dialogs, and timeout handling
 */
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import SessionTimeout from './SessionTimeout';
import { theme } from '../theme';

const renderWithProviders = (props = {}) => {
  const defaultProps = {
    warningTimeMinutes: 1, // 1 minute for testing
    sessionTimeoutMinutes: 2, // 2 minutes for testing
    checkIntervalSeconds: 1, // 1 second for testing
  };

  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <AuthProvider>
          <SessionTimeout {...defaultProps} {...props} />
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

// Mock timers
jest.useFakeTimers();

describe('SessionTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      role: 'admin' as const,
      name: 'Test User',
    };
    localStorage.setItem('solarium_user', JSON.stringify(mockUser));
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllTimers();
  });

  test('does not render when user is not authenticated', () => {
    localStorage.clear();

    renderWithProviders();

    // Should not show any dialogs
    expect(screen.queryByText('Session Expiring Soon')).not.toBeInTheDocument();
    expect(screen.queryByText('Session Expired')).not.toBeInTheDocument();
  });

  test('shows warning dialog when session is about to expire', async () => {
    renderWithProviders();

    // Fast forward to warning time (1 minute)
    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    });
  });

  test('shows expired dialog when session expires', async () => {
    renderWithProviders();

    // Fast forward to expiry time (2 minutes)
    act(() => {
      jest.advanceTimersByTime(120 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });
  });

  test('extends session when stay logged in is clicked', async () => {
    renderWithProviders();

    // Fast forward to warning time
    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Stay Logged In'));

    // Warning should disappear
    expect(screen.queryByText('Session Expiring Soon')).not.toBeInTheDocument();
  });

  test('logs out when logout button is clicked', async () => {
    renderWithProviders();

    // Fast forward to warning time
    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Logout Now'));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('resets timer on user activity', () => {
    renderWithProviders();

    // Simulate user activity
    act(() => {
      fireEvent.mouseMove(document);
    });

    // Fast forward to just before warning time
    act(() => {
      jest.advanceTimersByTime(59 * 1000);
    });

    // Should not show warning yet due to recent activity
    expect(screen.queryByText('Session Expiring Soon')).not.toBeInTheDocument();
  });
});
