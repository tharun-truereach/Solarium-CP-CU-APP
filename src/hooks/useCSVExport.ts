/**
 * CSV Export Hook
 *
 * Provides functionality to export leads to CSV format with current filters applied.
 * Handles file download, error states, loading indicators, and success notifications.
 *
 * @returns {UseCSVExportReturn} Object containing export state and methods
 *
 * @example
 * ```typescript
 * const { exportLeads, isExporting, error } = useCSVExport();
 *
 * // Export leads with filters
 * await exportLeads(
 *   { status: 'New Lead', state: 'Maharashtra' },
 *   { format: 'csv', filename: 'leads-jan-2024.csv' }
 * );
 * ```
 */

import { useState, useCallback } from 'react';
import { useExportLeadsQuery } from '../api/endpoints/leadEndpoints';
import { useToast } from './useToast';
import type { LeadQuery } from '../types/lead.types';

/**
 * Export options interface
 */
interface ExportOptions {
  format?: 'csv' | 'xlsx';
  filename?: string;
}

/**
 * Export hook return type
 */
interface UseCSVExportReturn {
  isExporting: boolean;
  exportLeads: (filters?: LeadQuery, options?: ExportOptions) => Promise<void>;
  error: any;
}

/**
 * Generate filename with timestamp
 */
const generateFilename = (format: 'csv' | 'xlsx' = 'csv'): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, '');
  return `leads-${timestamp}.${format}`;
};

/**
 * Download blob as file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * CSV Export Hook
 */
export const useCSVExport = (): UseCSVExportReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<any>(null);
  const { showSuccess, showError } = useToast();

  /**
   * Export leads function
   */
  const exportLeads = useCallback(
    async (filters: LeadQuery = {}, options: ExportOptions = {}) => {
      const { format = 'csv', filename } = options;

      try {
        setIsExporting(true);
        setExportError(null);

        // Show loading toast
        showSuccess('Export started...', 'Please wait');

        // Trigger the export query
        const response = await fetch(
          `/api/v1/leads/export?${new URLSearchParams({
            format,
            ...Object.fromEntries(
              Object.entries(filters || {})
                .filter(
                  ([_, value]) =>
                    value !== undefined && value !== null && value !== ''
                )
                .map(([key, value]) => [key, String(value)])
            ),
          }).toString()}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('solarium_token') || ''}`,
              Accept:
                format === 'csv'
                  ? 'text/csv'
                  : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Export failed: ${response.status} ${response.statusText}`
          );
        }

        // Get the blob
        const blob = await response.blob();

        // Generate filename if not provided
        const finalFilename = filename || generateFilename(format);

        // Download the file
        downloadBlob(blob, finalFilename);

        // Show success message
        showSuccess(
          `Successfully exported ${format.toUpperCase()} file`,
          'Export Complete'
        );

        console.log('✅ Export completed:', {
          format,
          filename: finalFilename,
          size: blob.size,
          filters,
        });
      } catch (error: any) {
        console.error('❌ Export failed:', error);
        setExportError(error);

        showError(
          error.message || 'Failed to export leads. Please try again.',
          'Export Failed'
        );
      } finally {
        setIsExporting(false);
      }
    },
    [showSuccess, showError]
  );

  return {
    isExporting,
    exportLeads,
    error: exportError,
  };
};

export default useCSVExport;
