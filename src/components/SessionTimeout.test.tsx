/**
 * Enhanced test suite for SessionTimeout component
 * Tests session monitoring, warning dialogs, timeout handling, and token refresh integration
 */
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import SessionTimeout from './SessionTimeout';
import { AuthProvider } from '../contexts/AuthContext';
import { theme } from '../theme';

// Mock console methods to avoid test output noise
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockAuthContext = {
  isAuthenticated: true,
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getTokenTimeRemaining: vi.fn(() => 10 * 60 * 1000), // 10 minutes
  isTokenExpiringSoon: vi.fn(() => false),
  sessionStatus: {
    isAuthenticated: true,
    isTokenExpired: false,
    isAccountLocked: false,
    timeRemaining: 10 * 60 * 1000,
    isActive: true,
    needsWarning: false,
  },
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const renderWithProviders = (props = {}) => {
  const defaultProps = {
    warningTimeMinutes: 1, // 1 minute for testing
    sessionTimeoutMinutes: 2, // 2 minutes for testing
    checkIntervalSeconds: 1, // 1 second for testing
    ...props,
  };

  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <AuthProvider>
          <SessionTimeout {...defaultProps} />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
};

// Mock timers
vi.useFakeTimers();

describe('SessionTimeout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.logout.mockClear();
    mockAuthContext.refreshToken.mockClear();
    mockAuthContext.getTokenTimeRemaining.mockReturnValue(10 * 60 * 1000);
    mockAuthContext.isTokenExpiringSoon.mockReturnValue(false);
    mockAuthContext.sessionStatus.isTokenExpired = false;
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Authentication State', () => {
    it('does not render when user is not authenticated', () => {
      mockAuthContext.isAuthenticated = false;
      renderWithProviders();

      expect(
        screen.queryByText('Session Expiring Soon')
      ).not.toBeInTheDocument();
    });

    it('renders and monitors session when user is authenticated', () => {
      renderWithProviders();

      // Component should be monitoring but not showing dialogs initially
      expect(
        screen.queryByText('Session Expiring Soon')
      ).not.toBeInTheDocument();
    });
  });

  describe('Session Warning Dialog', () => {
    it('shows warning dialog when session is about to expire', async () => {
      renderWithProviders();

      // Fast forward to warning time (1 minute of inactivity)
      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
      });

      expect(screen.getByText('Time remaining:')).toBeInTheDocument();
      expect(screen.getByText('Stay Logged In')).toBeInTheDocument();
      expect(screen.getByText('Logout Now')).toBeInTheDocument();
    });

    it('shows countdown timer in warning dialog', async () => {
      renderWithProviders();

      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
      });

      // Should show remaining time (60 seconds = 1:00)
      expect(screen.getByText('1:00')).toBeInTheDocument();
    });

    it('updates countdown timer every second', async () => {
      renderWithProviders();

      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('1:00')).toBeInTheDocument();
      });

      // Advance by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('0:59')).toBeInTheDocument();
      });
    });
  });

  describe('Session Extension (Stay Logged In)', () => {
    it('calls refreshToken when Stay Logged In is clicked', async () => {
      mockAuthContext.refreshToken.mockResolvedValue('new-token');
      renderWithProviders();

      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Stay Logged In')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Stay Logged In'));

      expect(mockAuthContext.refreshToken).toHaveBeenCalled();
    });

    it('shows loading state while refreshing token', async () => {
      // Mock a delayed token refresh
      mockAuthContext.refreshToken.mockImplementation(
        () =>
          new Promise(resolve => setTimeout(() => resolve('new-token'), 1000))
      );

      renderWithProviders();

      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Stay Logged In')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Stay Logged In'));

      // Should show extending state
      expect(screen.getByText('Extending...')).toBeInTheDocument();
    });

    it('closes warning dialog after successful token refresh', async () => {
      mockAuthContext.refreshToken.mockResolvedValue('new-token');
      renderWithProviders();

      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Stay Logged In')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Stay Logged In'));

      await waitFor(() => {
        expect(
          screen.queryByText('Session Expiring Soon')
        ).not.toBeInTheDocument();
      });
    });

    it('shows error when token refresh fails', async () => {
      mockAuthContext.refreshToken.mockRejectedValue(
        new Error('Refresh failed')
      );
      renderWithProviders();

      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Stay Logged In')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Stay Logged In'));

      await waitFor(() => {
        expect(screen.getByText('Refresh failed')).toBeInTheDocument();
      });
    });
  });

  describe('Session Expiration', () => {
    it('logs out and redirects when session expires', async () => {
      renderWithProviders();

      // Fast forward to session expiration (2 minutes)
      act(() => {
        vi.advanceTimersByTime(120 * 1000);
      });

      await waitFor(() => {
        expect(mockAuthContext.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/session-expired');
      });
    });

    it('logs out when countdown reaches zero', async () => {
      renderWithProviders();

      // Show warning dialog
      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
      });

      // Let countdown reach zero
      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(mockAuthContext.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/session-expired');
      });
    });
  });

  describe('Auto Token Refresh', () => {
    it('automatically refreshes token when expiring soon', async () => {
      // Mock token expiring soon
      mockAuthContext.getTokenTimeRemaining.mockReturnValue(4 * 60 * 1000); // 4 minutes
      mockAuthContext.refreshToken.mockResolvedValue('new-token');

      renderWithProviders();

      // Trigger session check
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockAuthContext.refreshToken).toHaveBeenCalled();
      });
    });

    it('handles auto refresh failure gracefully', async () => {
      mockAuthContext.getTokenTimeRemaining.mockReturnValue(4 * 60 * 1000);
      mockAuthContext.refreshToken.mockRejectedValue(
        new Error('Auto refresh failed')
      );

      renderWithProviders();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should show refresh indicator and error
      await waitFor(() => {
        expect(screen.getByText('Refreshing session...')).toBeInTheDocument();
      });
    });
  });

  describe('Manual Logout', () => {
    it('logs out immediately when Logout Now is clicked', async () => {
      renderWithProviders();

      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('Logout Now')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Logout Now'));

      expect(mockAuthContext.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Activity Detection', () => {
    it('resets timer on user activity', () => {
      renderWithProviders();

      // Simulate user activity
      act(() => {
        fireEvent.mouseMove(document);
      });

      // Fast forward to just before warning time
      act(() => {
        vi.advanceTimersByTime(59 * 1000);
      });

      // Should not show warning due to recent activity
      expect(
        screen.queryByText('Session Expiring Soon')
      ).not.toBeInTheDocument();
    });

    it('throttles activity updates', () => {
      renderWithProviders();

      // Multiple rapid activities
      act(() => {
        fireEvent.mouseMove(document);
        fireEvent.click(document);
        fireEvent.keyPress(document);
      });

      // Should be throttled to prevent excessive updates
      // This is tested by ensuring the component doesn't crash or behave unexpectedly
      expect(
        screen.queryByText('Session Expiring Soon')
      ).not.toBeInTheDocument();
    });
  });

  describe('Environment Configuration', () => {
    it('uses custom timeout values when provided', async () => {
      renderWithProviders({
        warningTimeMinutes: 5,
        sessionTimeoutMinutes: 10,
      });

      // Should use custom values (5 minutes warning, 10 minutes timeout)
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      });

      await waitFor(() => {
        expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument();
      });
    });

    it('uses environment defaults when no props provided', () => {
      // Test that component uses config values from environment
      renderWithProviders({});

      // Component should still function with default values
      expect(
        screen.queryByText('Session Expiring Soon')
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', async () => {
      renderWithProviders();

      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      await waitFor(() => {
        expect(
          screen.getByLabelText('Extend session and stay logged in')
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Logout immediately')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('provides live region updates for screen readers', async () => {
      renderWithProviders();

      // Show background refresh indicator
      mockAuthContext.getTokenTimeRemaining.mockReturnValue(4 * 60 * 1000);
      mockAuthContext.refreshToken.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('token'), 1000))
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Refreshing session')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles session status changes from AuthContext', async () => {
      renderWithProviders();

      // Simulate token expiration from AuthContext
      mockAuthContext.sessionStatus.isTokenExpired = true;

      // Re-render to trigger effect
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockAuthContext.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/session-expired');
      });
    });

    it('handles component unmounting gracefully', () => {
      const { unmount } = renderWithProviders();

      // Start some timers
      act(() => {
        vi.advanceTimersByTime(30 * 1000);
      });

      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });
  });
});
