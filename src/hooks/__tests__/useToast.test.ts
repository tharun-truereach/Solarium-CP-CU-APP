/**
 * useToast Hook Tests
 * Tests toast functionality and state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toastState.open).toBe(false);
      expect(result.current.toastState.message).toBe('');
      expect(result.current.toastState.severity).toBe('info');
      expect(result.current.toastState.duration).toBe(6000);
      expect(result.current.toastState.position).toEqual({
        vertical: 'bottom',
        horizontal: 'left',
      });
    });
  });

  describe('showToast', () => {
    it('should show toast with message', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Test message');
      });

      expect(result.current.toastState.open).toBe(true);
      expect(result.current.toastState.message).toBe('Test message');
      expect(result.current.toastState.severity).toBe('info');
    });

    it('should show toast with custom options', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Test message', {
          severity: 'warning',
          title: 'Warning Title',
          duration: 3000,
          position: { vertical: 'top', horizontal: 'center' },
        });
      });

      expect(result.current.toastState.open).toBe(true);
      expect(result.current.toastState.message).toBe('Test message');
      expect(result.current.toastState.severity).toBe('warning');
      expect(result.current.toastState.title).toBe('Warning Title');
      expect(result.current.toastState.duration).toBe(3000);
      expect(result.current.toastState.position).toEqual({
        vertical: 'top',
        horizontal: 'center',
      });
    });
  });

  describe('Convenience Methods', () => {
    it('should show success toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showSuccess('Success message', 'Success Title');
      });

      expect(result.current.toastState.open).toBe(true);
      expect(result.current.toastState.message).toBe('Success message');
      expect(result.current.toastState.severity).toBe('success');
      expect(result.current.toastState.title).toBe('Success Title');
    });

    it('should show error toast with longer duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showError('Error message', 'Error Title');
      });

      expect(result.current.toastState.open).toBe(true);
      expect(result.current.toastState.message).toBe('Error message');
      expect(result.current.toastState.severity).toBe('error');
      expect(result.current.toastState.title).toBe('Error Title');
      expect(result.current.toastState.duration).toBe(8000);
    });

    it('should show warning toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showWarning('Warning message');
      });

      expect(result.current.toastState.open).toBe(true);
      expect(result.current.toastState.message).toBe('Warning message');
      expect(result.current.toastState.severity).toBe('warning');
    });

    it('should show info toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showInfo('Info message');
      });

      expect(result.current.toastState.open).toBe(true);
      expect(result.current.toastState.message).toBe('Info message');
      expect(result.current.toastState.severity).toBe('info');
    });
  });

  describe('hideToast', () => {
    it('should hide toast', () => {
      const { result } = renderHook(() => useToast());

      // First show a toast
      act(() => {
        result.current.showSuccess('Test message');
      });

      expect(result.current.toastState.open).toBe(true);

      // Then hide it
      act(() => {
        result.current.hideToast();
      });

      expect(result.current.toastState.open).toBe(false);
    });

    it('should preserve other state when hiding', () => {
      const { result } = renderHook(() => useToast());

      // Show a toast with specific properties
      act(() => {
        result.current.showError('Error message', 'Error Title');
      });

      // Hide the toast
      act(() => {
        result.current.hideToast();
      });

      expect(result.current.toastState.open).toBe(false);
      expect(result.current.toastState.message).toBe('Error message');
      expect(result.current.toastState.severity).toBe('error');
      expect(result.current.toastState.title).toBe('Error Title');
    });
  });

  describe('Multiple Toast Updates', () => {
    it('should update toast state correctly on multiple calls', () => {
      const { result } = renderHook(() => useToast());

      // Show first toast
      act(() => {
        result.current.showSuccess('First message');
      });

      expect(result.current.toastState.message).toBe('First message');
      expect(result.current.toastState.severity).toBe('success');

      // Show second toast
      act(() => {
        result.current.showError('Second message');
      });

      expect(result.current.toastState.message).toBe('Second message');
      expect(result.current.toastState.severity).toBe('error');
      expect(result.current.toastState.open).toBe(true);
    });
  });

  describe('Default Values', () => {
    it('should handle undefined options gracefully', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Test message', {});
      });

      expect(result.current.toastState.severity).toBe('info');
      expect(result.current.toastState.duration).toBe(6000);
      expect(result.current.toastState.title).toBeUndefined();
    });

    it('should handle partial options', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.showToast('Test message', {
          severity: 'warning',
          // Other options omitted
        });
      });

      expect(result.current.toastState.severity).toBe('warning');
      expect(result.current.toastState.duration).toBe(6000); // Default
      expect(result.current.toastState.position).toEqual({
        vertical: 'bottom',
        horizontal: 'left',
      }); // Default
    });
  });

  describe('Hook Stability', () => {
    it('should have stable function references', () => {
      const { result, rerender } = renderHook(() => useToast());

      const firstShowToast = result.current.showToast;
      const firstHideToast = result.current.hideToast;

      rerender();

      expect(result.current.showToast).toBe(firstShowToast);
      expect(result.current.hideToast).toBe(firstHideToast);
    });
  });
});
