/**
 * Toast Hook
 * Provides a convenient way to show toast notifications
 */

import { useState, useCallback } from 'react';
import type { ToastSeverity, ToastPosition } from '../components/ui/AppToast';

/**
 * Toast state interface
 */
interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
  title?: string;
  duration?: number;
  position?: ToastPosition;
}

/**
 * Toast hook return type
 */
interface UseToastReturn {
  toastState: ToastState;
  showToast: (
    message: string,
    options?: {
      severity?: ToastSeverity;
      title?: string;
      duration?: number;
      position?: ToastPosition;
    }
  ) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  hideToast: () => void;
}

/**
 * Default toast position
 */
const DEFAULT_POSITION: ToastPosition = {
  vertical: 'bottom',
  horizontal: 'left',
};

/**
 * Toast hook
 */
export const useToast = (): UseToastReturn => {
  const [toastState, setToastState] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 6000,
    position: DEFAULT_POSITION,
  });

  /**
   * Show toast with custom options
   */
  const showToast = useCallback(
    (
      message: string,
      options: {
        severity?: ToastSeverity;
        title?: string;
        duration?: number;
        position?: ToastPosition;
      } = {}
    ) => {
      setToastState({
        open: true,
        message,
        severity: options.severity || 'info',
        ...(options.title && { title: options.title }),
        duration: options.duration ?? 6000,
        position: options.position || DEFAULT_POSITION,
      });
    },
    []
  );

  /**
   * Show success toast
   */
  const showSuccess = useCallback(
    (message: string, title?: string) => {
      showToast(message, { severity: 'success', ...(title && { title }) });
    },
    [showToast]
  );

  /**
   * Show error toast
   */
  const showError = useCallback(
    (message: string, title?: string) => {
      showToast(message, {
        severity: 'error',
        ...(title && { title }),
        duration: 8000,
      });
    },
    [showToast]
  );

  /**
   * Show warning toast
   */
  const showWarning = useCallback(
    (message: string, title?: string) => {
      showToast(message, { severity: 'warning', ...(title && { title }) });
    },
    [showToast]
  );

  /**
   * Show info toast
   */
  const showInfo = useCallback(
    (message: string, title?: string) => {
      showToast(message, { severity: 'info', ...(title && { title }) });
    },
    [showToast]
  );

  /**
   * Hide toast
   */
  const hideToast = useCallback(() => {
    setToastState(prev => ({
      ...prev,
      open: false,
    }));
  }, []);

  return {
    toastState,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };
};

export default useToast;
