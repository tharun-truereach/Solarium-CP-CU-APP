/**
 * Custom hook for bulk lead actions
 * Provides shared logic for bulk status updates and reassignments
 */

import { useState, useCallback } from 'react';
import { useToast } from './useToast';
import type { BulkOperationResponse } from '../types/lead.types';

/**
 * Bulk lead actions hook return type
 */
interface UseBulkLeadActionsReturn {
  isProcessing: boolean;
  lastResult: BulkOperationResponse | null;
  processWithResult: <T>(
    operation: () => Promise<T>,
    successMessage: string,
    errorMessage: string
  ) => Promise<T | null>;
  clearResult: () => void;
}

/**
 * Hook for managing bulk lead actions
 */
export const useBulkLeadActions = (): UseBulkLeadActionsReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<BulkOperationResponse | null>(
    null
  );
  const { showSuccess, showError } = useToast();

  /**
   * Process operation with result handling
   */
  const processWithResult = useCallback(
    async <T>(
      operation: () => Promise<T>,
      successMessage: string,
      errorMessage: string
    ): Promise<T | null> => {
      setIsProcessing(true);
      try {
        const result = await operation();

        // If result is a bulk operation response, store it
        if (
          result &&
          typeof result === 'object' &&
          'data' in result &&
          'success' in result
        ) {
          const bulkResult = result as BulkOperationResponse;
          setLastResult(bulkResult);

          // Show appropriate toast
          if (bulkResult.data.successful > 0) {
            showSuccess(
              `${successMessage}: ${bulkResult.data.successful} of ${bulkResult.data.total} items`,
              'Operation Complete'
            );
          }

          if (bulkResult.data.failed > 0) {
            showError(
              `${errorMessage}: ${bulkResult.data.failed} items failed`,
              'Partial Failure'
            );
          }
        }

        return result;
      } catch (error: any) {
        console.error('Bulk operation failed:', error);
        showError(error?.data?.message || errorMessage, 'Operation Failed');
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [showSuccess, showError]
  );

  /**
   * Clear stored result
   */
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    isProcessing,
    lastResult,
    processWithResult,
    clearResult,
  };
};

export default useBulkLeadActions;
