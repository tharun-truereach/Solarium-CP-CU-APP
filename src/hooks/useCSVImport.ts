/**
 * CSV Import Hook
 * Handles CSV file parsing, validation, and template generation
 */

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type { LeadImportError } from '../types/lead.types';

/**
 * CSV Import hook configuration
 */
interface UseCSVImportConfig {
  requiredColumns: string[];
  optionalColumns: string[];
  maxRows: number;
}

/**
 * Parsed CSV row
 */
interface CSVRow {
  [key: string]: string;
}

/**
 * Hook return type
 */
interface UseCSVImportReturn {
  file: File | null;
  parsedData: CSVRow[] | null;
  validationErrors: LeadImportError[];
  isValidFile: boolean;
  isProcessing: boolean;
  parseCSV: (file: File) => Promise<void>;
  clearData: () => void;
  downloadTemplate: () => void;
}

/**
 * Validation rules for CSV fields
 */
const validateCSVRow = (
  row: CSVRow,
  rowIndex: number,
  requiredColumns: string[]
): LeadImportError[] => {
  const errors: LeadImportError[] = [];

  // Check required columns
  requiredColumns.forEach(column => {
    const value = row[column]?.trim();
    if (!value) {
      errors.push({
        row: rowIndex,
        field: column,
        value: value || '',
        message: `${column} is required`,
      });
    }
  });

  // Validate specific fields
  if (row.customerPhone) {
    const phone = row.customerPhone.trim();
    if (phone && !/^\+?[\d\s\-()]{10,}$/.test(phone)) {
      errors.push({
        row: rowIndex,
        field: 'customerPhone',
        value: phone,
        message: 'Invalid phone number format',
      });
    }
  }

  if (row.customerEmail) {
    const email = row.customerEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        row: rowIndex,
        field: 'customerEmail',
        value: email,
        message: 'Invalid email format',
      });
    }
  }

  if (row.pinCode) {
    const pinCode = row.pinCode.trim();
    if (pinCode && !/^\d{6}$/.test(pinCode)) {
      errors.push({
        row: rowIndex,
        field: 'pinCode',
        value: pinCode,
        message: 'PIN code must be 6 digits',
      });
    }
  }

  if (row.followUpDate) {
    const date = row.followUpDate.trim();
    if (date && !Date.parse(date)) {
      errors.push({
        row: rowIndex,
        field: 'followUpDate',
        value: date,
        message: 'Invalid date format (use YYYY-MM-DD)',
      });
    }
  }

  return errors;
};

/**
 * CSV Import Hook
 */
export const useCSVImport = (
  config: UseCSVImportConfig
): UseCSVImportReturn => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<LeadImportError[]>(
    []
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const { requiredColumns, optionalColumns, maxRows } = config;
  const allColumns = [...requiredColumns, ...optionalColumns];

  /**
   * Parse CSV file
   */
  const parseCSV = useCallback(
    async (csvFile: File): Promise<void> => {
      setIsProcessing(true);
      setFile(csvFile);

      return new Promise<void>((resolve, reject) => {
        Papa.parse(csvFile, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
          complete: (results: any) => {
            try {
              const data = results.data as CSVRow[];

              // Check if file has too many rows
              if (data.length > maxRows) {
                reject(
                  new Error(
                    `File contains ${data.length} rows, but maximum allowed is ${maxRows}`
                  )
                );
                return;
              }

              // Check for required columns
              const headers = Object.keys(data[0] || {});
              const missingColumns = requiredColumns.filter(
                col => !headers.includes(col)
              );

              if (missingColumns.length > 0) {
                reject(
                  new Error(
                    `Missing required columns: ${missingColumns.join(', ')}`
                  )
                );
                return;
              }

              // Validate each row
              const errors: LeadImportError[] = [];
              data.forEach((row, index) => {
                const rowErrors = validateCSVRow(
                  row,
                  index + 2,
                  requiredColumns
                ); // +2 for header row + 1-based indexing
                errors.push(...rowErrors);
              });

              setParsedData(data);
              setValidationErrors(errors);
              setIsProcessing(false);
              resolve();
            } catch (error: any) {
              setIsProcessing(false);
              reject(error);
            }
          },
          error: (error: any) => {
            setIsProcessing(false);
            reject(new Error(`Failed to parse CSV: ${error.message}`));
          },
        });
      });
    },
    [requiredColumns, maxRows]
  );

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setValidationErrors([]);
    setIsProcessing(false);
  }, []);

  /**
   * Download CSV template
   */
  const downloadTemplate = useCallback(() => {
    const headers = [...requiredColumns, ...optionalColumns];
    const sampleData = [
      [
        'John Doe',
        '+91-9876543210',
        '123 Main Street, City',
        'Maharashtra',
        '400001',
        'john@example.com',
        'Solar Panel Installation',
        'Residential rooftop installation',
        'CP-001',
        'website',
        '2024-02-01',
        'Interested in 5kW system',
      ],
      [
        'Jane Smith',
        '+91-8765432109',
        '456 Oak Avenue, Town',
        'Gujarat',
        '380001',
        'jane@example.com',
        'Solar Water Heater',
        'Commercial installation',
        'CP-002',
        'referral',
        '2024-02-02',
        'Urgent requirement',
      ],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `lead-import-template-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [requiredColumns, optionalColumns]);

  /**
   * Check if file is valid for import
   */
  const isValidFile = !!(
    parsedData &&
    parsedData.length > 0 &&
    validationErrors.length === 0 &&
    parsedData.length <= maxRows
  );

  return {
    file,
    parsedData,
    validationErrors,
    isValidFile,
    isProcessing,
    parseCSV,
    clearData,
    downloadTemplate,
  };
};

export default useCSVImport;
