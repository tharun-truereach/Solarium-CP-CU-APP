/**
 * Custom hook for managing component-level loading states
 * Provides utilities for handling async operations with loading indicators
 */
import { useState, useCallback } from 'react';
import { useLoading } from '../contexts/LoadingContext';

export interface UseLoadingStateOptions {
  globalLoading?: boolean;
  loadingMessage?: string;
  loadingType?: 'global' | 'page' | 'component' | 'data';
}

export interface UseLoadingStateReturn {
  isLoading: boolean;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(asyncFn: () => Promise<T>, message?: string) => Promise<T>;
}

export const useLoadingState = (
  options: UseLoadingStateOptions = {}
): UseLoadingStateReturn => {
  const [localLoading, setLocalLoading] = useState(false);
  const { startLoading: startGlobalLoading, stopLoading: stopGlobalLoading } =
    useLoading();

  const {
    globalLoading = false,
    loadingMessage = 'Loading...',
    loadingType = 'component',
  } = options;

  const startLoading = useCallback(
    (message?: string) => {
      if (globalLoading) {
        startGlobalLoading(message || loadingMessage, loadingType);
      } else {
        setLocalLoading(true);
      }
    },
    [globalLoading, startGlobalLoading, loadingMessage, loadingType]
  );

  const stopLoading = useCallback(() => {
    if (globalLoading) {
      stopGlobalLoading();
    } else {
      setLocalLoading(false);
    }
  }, [globalLoading, stopGlobalLoading]);

  const withLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>, message?: string): Promise<T> => {
      startLoading(message);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading: globalLoading ? false : localLoading, // Global loading is handled separately
    startLoading,
    stopLoading,
    withLoading,
  };
};
