/**
 * Test suite for SessionExpired page component
 * Tests session expiry page display and navigation
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import SessionExpired from './SessionExpired';
import { theme } from '../theme';

const renderWithProviders = () => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <SessionExpired />
      </MemoryRouter>
    </ThemeProvider>
  );
};

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SessionExpired', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders session expired message', () => {
    renderWithProviders();

    expect(screen.getByText('Session Expired')).toBeInTheDocument();
    expect(
      screen.getByText(/Your session has expired due to inactivity/)
    ).toBeInTheDocument();
  });

  test('displays security notice', () => {
    renderWithProviders();

    expect(screen.getByText(/Security Notice:/)).toBeInTheDocument();
    expect(
      screen.getByText(/Sessions automatically expire after 30 minutes/)
    ).toBeInTheDocument();
  });

  test('handles login button click', () => {
    renderWithProviders();

    fireEvent.click(screen.getByText('Login Again'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('displays help text', () => {
    renderWithProviders();

    expect(
      screen.getByText(/If you continue to experience issues/)
    ).toBeInTheDocument();
  });
});
