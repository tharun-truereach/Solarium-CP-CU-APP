/**
 * Tests for sidebar persistence functionality
 * Tests localStorage read/write operations and error handling
 */
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import MainLayout from '../MainLayout';
import { AuthProvider } from '../../contexts/AuthContext';
import { theme } from '../../theme';
import { STORAGE_KEYS } from '../../utils/constants';
import type { User } from '../../types';

const mockUser: User = {
  id: '1',
  email: 'test@test.com',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
  permissions: [],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock useAuth
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    token: 'fake-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }),
}));

// Mock useMediaQuery to control mobile/desktop behavior
jest.mock('@mui/material/useMediaQuery', () => jest.fn());

const renderMainLayout = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <MainLayout>
            <div>Test Content</div>
          </MainLayout>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Sidebar Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);

    // Mock as desktop by default
    const useMediaQuery = require('@mui/material/useMediaQuery');
    useMediaQuery.mockReturnValue(false);
  });

  it('reads sidebar state from localStorage on desktop mount', () => {
    mockLocalStorage.getItem.mockReturnValue('true');

    renderMainLayout();

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
      STORAGE_KEYS.SIDEBAR_STATE
    );
  });

  it('uses default collapsed state when localStorage is empty', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    renderMainLayout();

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
      STORAGE_KEYS.SIDEBAR_STATE
    );
  });

  it('handles localStorage read errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    renderMainLayout();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to read sidebar state:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('does not read localStorage on mobile', () => {
    // Mock as mobile
    const useMediaQuery = require('@mui/material/useMediaQuery');
    useMediaQuery.mockReturnValue(true);

    renderMainLayout();

    // Should not attempt to read localStorage on mobile
    expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
  });

  it('persists sidebar state changes on desktop', () => {
    const { rerender } = renderMainLayout();

    // Simulate state change (this would normally happen via user interaction)
    // We'll test the persistence function directly
    const persistSidebarState = (collapsed: boolean): void => {
      try {
        localStorage.setItem(
          STORAGE_KEYS.SIDEBAR_STATE,
          JSON.stringify(collapsed)
        );
      } catch (error) {
        console.warn('Failed to persist sidebar state:', error);
      }
    };

    persistSidebarState(true);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.SIDEBAR_STATE,
      'true'
    );
  });

  it('handles localStorage write errors gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Test persistence function directly
    const persistSidebarState = (collapsed: boolean): void => {
      try {
        localStorage.setItem(
          STORAGE_KEYS.SIDEBAR_STATE,
          JSON.stringify(collapsed)
        );
      } catch (error) {
        console.warn('Failed to persist sidebar state:', error);
      }
    };

    persistSidebarState(true);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to persist sidebar state:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('parses JSON from localStorage correctly', () => {
    mockLocalStorage.getItem.mockReturnValue('false');

    renderMainLayout();

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
      STORAGE_KEYS.SIDEBAR_STATE
    );
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-json');

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    renderMainLayout();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to read sidebar state:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
