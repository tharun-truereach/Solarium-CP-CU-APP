/**
 * CSV Toolkit for Lead Import/Export
 * Handles CSV parsing, validation, and generation with Web Worker support
 */

import Papa from 'papaparse';
import type { Lead, LeadCreatePayload } from '../../types/lead.types';

/**
 * CSV parsing configuration
 */
export interface CSVParseConfig {
  delimiter?: string;
  header?: boolean;
  skipEmptyLines?: boolean;
  trimWhitespace?: boolean;
  maxRows?: number;
}

/**
 * CSV parsing result
 */
export interface CSVParseResult<T = any> {
  data: T[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

/**
 * Lead CSV row interface
 */
export interface LeadCSVRow {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  state: string;
  pinCode: string;
  services?: string;
  requirements?: string;
  assignedTo?: string;
  source?: string;
  followUpDate?: string;
  remarks?: string;
}

/**
 * CSV validation error
 */
export interface CSVValidationError {
  row: number;
  field: string;
  value: any;
  reason: string;
}

/**
 * CSV validation result
 */
export interface CSVValidationResult {
  isValid: boolean;
  errors: CSVValidationError[];
  validatedData: LeadCreatePayload[];
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
  fields?: string[];
}

/**
 * Default CSV parsing configuration
 */
const DEFAULT_PARSE_CONFIG: CSVParseConfig = {
  delimiter: ',',
  header: true,
  skipEmptyLines: true,
  trimWhitespace: true,
  maxRows: 50, // Enforce 50 row limit
};

/**
 * Required fields for lead CSV
 */
const REQUIRED_FIELDS = [
  'customerName',
  'customerPhone',
  'address',
  'state',
  'pinCode',
] as const;

/**
 * Optional fields for lead CSV
 */
const OPTIONAL_FIELDS = [
  'customerEmail',
  'services',
  'requirements',
  'assignedTo',
  'source',
  'followUpDate',
  'remarks',
] as const;

/**
 * All valid CSV fields
 */
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as const;

/**
 * Phone number validation regex
 */
const PHONE_REGEX = /^(\+91|91|0)?[6789]\d{9}$/;

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PIN code validation regex
 */
const PIN_REGEX = /^\d{6}$/;

/**
 * CSV Toolkit for Lead Import/Export Operations
 *
 * Provides comprehensive CSV handling including:
 * - File validation (size, type, format)
 * - Data parsing with error handling
 * - Business rule validation for lead data
 * - CSV generation from lead objects
 * - File download utilities
 * - Import templates
 *
 * Key Features:
 * - 50-row limit enforcement for performance
 * - All-or-nothing validation approach
 * - Indian phone number validation
 * - Date format standardization
 * - Memory-efficient parsing
 *
 * @example
 * ```typescript
 * // Validate and parse CSV file
 * const parseResult = await CSVToolkit.parseCSV(file);
 * const validation = CSVToolkit.validateLeadData(parseResult.data);
 *
 * if (validation.isValid) {
 *   // Proceed with import
 *   const importData = validation.validatedData;
 * }
 *
 * // Export leads to CSV
 * const csvContent = CSVToolkit.exportToCSV(leads, {
 *   fields: ['leadId', 'customerName', 'status'],
 *   includeHeaders: true
 * });
 * ```
 */
export class CSVToolkit {
  /**
   * Parse CSV file or string
   */
  static async parseCSV<T = LeadCSVRow>(
    input: File | string,
    config: CSVParseConfig = {}
  ): Promise<CSVParseResult<T>> {
    const parseConfig = { ...DEFAULT_PARSE_CONFIG, ...config };

    return new Promise((resolve, reject) => {
      Papa.parse(input, {
        ...parseConfig,
        complete: (results: Papa.ParseResult<T>) => {
          const totalRows = results.data.length;

          // Enforce max rows limit
          if (parseConfig.maxRows && totalRows > parseConfig.maxRows) {
            reject(
              new Error(
                `CSV contains ${totalRows} rows, but maximum allowed is ${parseConfig.maxRows} rows.`
              )
            );
            return;
          }

          const validRows = results.data.filter(
            row => row && typeof row === 'object' && Object.keys(row).length > 0
          ).length;

          const parseResult: CSVParseResult<T> = {
            data: results.data,
            errors: results.errors,
            meta: results.meta,
            totalRows,
            validRows,
            invalidRows: totalRows - validRows,
          };

          resolve(parseResult);
        },
        error: (error: Papa.ParseError) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  }

  /**
   * Validate parsed CSV data for lead import
   */
  static validateLeadData(data: LeadCSVRow[]): CSVValidationResult {
    const errors: CSVValidationError[] = [];
    const validatedData: LeadCreatePayload[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 1; // 1-based row numbering
      const rowErrors: CSVValidationError[] = [];

      // Check required fields
      REQUIRED_FIELDS.forEach(field => {
        const value = row[field];
        if (!value || typeof value !== 'string' || value.trim() === '') {
          rowErrors.push({
            row: rowNumber,
            field,
            value,
            reason: `${field} is required and cannot be empty`,
          });
        }
      });

      // Validate specific fields
      if (row.customerPhone) {
        const phone = row.customerPhone.trim();
        if (!PHONE_REGEX.test(phone)) {
          rowErrors.push({
            row: rowNumber,
            field: 'customerPhone',
            value: phone,
            reason:
              'Invalid phone number format. Must be a valid Indian mobile number',
          });
        }
      }

      if (row.customerEmail) {
        const email = row.customerEmail.trim();
        if (email && !EMAIL_REGEX.test(email)) {
          rowErrors.push({
            row: rowNumber,
            field: 'customerEmail',
            value: email,
            reason: 'Invalid email format',
          });
        }
      }

      if (row.pinCode) {
        const pin = row.pinCode.trim();
        if (!PIN_REGEX.test(pin)) {
          rowErrors.push({
            row: rowNumber,
            field: 'pinCode',
            value: pin,
            reason: 'PIN code must be exactly 6 digits',
          });
        }
      }

      if (row.followUpDate) {
        const date = new Date(row.followUpDate);
        if (isNaN(date.getTime())) {
          rowErrors.push({
            row: rowNumber,
            field: 'followUpDate',
            value: row.followUpDate,
            reason: 'Invalid date format. Use YYYY-MM-DD format',
          });
        }
      }

      // If row has errors, add them to the main errors array
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        // Create validated lead payload
        const leadPayload: LeadCreatePayload = {
          customerName: row.customerName.trim(),
          customerPhone: row.customerPhone.trim(),
          address: row.address.trim(),
          state: row.state.trim(),
          pinCode: row.pinCode.trim(),
          ...(row.customerEmail && { customerEmail: row.customerEmail.trim() }),
          ...(row.services && {
            services: row.services.split(',').map(s => s.trim()),
          }),
          ...(row.requirements && { requirements: row.requirements.trim() }),
          ...(row.assignedTo && { assignedTo: row.assignedTo.trim() }),
          ...(row.source && { source: row.source.trim() as any }),
          ...(row.followUpDate && { followUpDate: row.followUpDate.trim() }),
          ...(row.remarks && { remarks: row.remarks.trim() }),
        };

        validatedData.push(leadPayload);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validatedData,
    };
  }

  /**
   * Generate CSV content from lead data
   */
  static exportToCSV(leads: Lead[], options: CSVExportOptions = {}): string {
    const {
      includeHeaders = true,
      delimiter = ',',
      fields = [
        'leadId',
        'customerName',
        'customerPhone',
        'customerEmail',
        'address',
        'state',
        'pinCode',
        'status',
        'assignedCpName',
        'territory',
        'followUpDate',
        'createdAt',
        'remarks',
      ],
    } = options;

    // Prepare data for CSV generation
    const csvData = leads.map(lead => {
      const row: Record<string, any> = {};

      fields.forEach(field => {
        let value = lead[field as keyof Lead];

        // Handle special formatting
        if (
          field === 'createdAt' ||
          field === 'updatedAt' ||
          field === 'followUpDate'
        ) {
          value = value
            ? new Date(value as string).toISOString().split('T')[0]
            : '';
        } else if (field === 'services' && Array.isArray(value)) {
          value = (value as string[]).join(', ');
        } else if (value === null || value === undefined) {
          value = '';
        }

        row[field] = value;
      });

      return row;
    });

    // Generate CSV using Papa Parse
    return (Papa as any).unparse(csvData, {
      header: includeHeaders,
      delimiter,
      quotes: true,
    });
  }

  /**
   * Download CSV as file
   */
  static downloadCSV(
    csvContent: string,
    filename: string = 'leads-export.csv'
  ): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Get CSV template for lead import
   */
  static getImportTemplate(): string {
    const headers = [
      'customerName',
      'customerPhone',
      'customerEmail',
      'address',
      'state',
      'pinCode',
      'services',
      'requirements',
      'assignedTo',
      'source',
      'followUpDate',
      'remarks',
    ];

    const sampleData = [
      {
        customerName: 'John Doe',
        customerPhone: '9876543210',
        customerEmail: 'john.doe@example.com',
        address: '123 Main Street, Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        services: 'Solar Panel Installation',
        requirements: 'Residential 5kW system',
        assignedTo: '',
        source: 'website',
        followUpDate: '2024-02-01',
        remarks: 'Interested in government subsidies',
      },
    ];

    return (Papa as any).unparse(sampleData, {
      header: true,
      delimiter: ',',
    });
  }

  /**
   * Validate CSV file before parsing
   */
  static validateFile(file: File): string | null {
    // Check file type
    if (
      !file.type.includes('csv') &&
      !file.name.toLowerCase().endsWith('.csv')
    ) {
      return 'File must be a CSV file (.csv)';
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return `File size must be less than ${maxSize / (1024 * 1024)}MB`;
    }

    // Check if file is empty
    if (file.size === 0) {
      return 'File cannot be empty';
    }

    return null; // Valid file
  }
}

/**
 * Web Worker for CSV parsing (for large files)
 */
export class CSVWorker {
  private worker: Worker | null = null;

  /**
   * Parse CSV using Web Worker
   */
  async parseInWorker<T = LeadCSVRow>(
    file: File,
    config: CSVParseConfig = {}
  ): Promise<CSVParseResult<T>> {
    return new Promise((resolve, reject) => {
      // Create worker from inline code (for Vite compatibility)
      const workerCode = `
        importScripts('https://unpkg.com/papaparse@5.4.1/papaparse.min.js');
        
        self.onmessage = function(e) {
          const { file, config } = e.data;
          
          Papa.parse(file, {
            ...config,
            complete: function(results) {
              const totalRows = results.data.length;
              const validRows = results.data.filter(row => 
                row && typeof row === 'object' && Object.keys(row).length > 0
              ).length;

              self.postMessage({
                type: 'success',
                data: {
                  data: results.data,
                  errors: results.errors,
                  meta: results.meta,
                  totalRows,
                  validRows,
                  invalidRows: totalRows - validRows,
                }
              });
            },
            error: function(error) {
              self.postMessage({
                type: 'error',
                error: error.message
              });
            }
          });
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));

      this.worker.onmessage = e => {
        const { type, data, error } = e.data;

        if (type === 'success') {
          resolve(data);
        } else {
          reject(new Error(error));
        }

        this.cleanup();
      };

      this.worker.onerror = error => {
        reject(error);
        this.cleanup();
      };

      // Send file and config to worker
      this.worker.postMessage({
        file,
        config: { ...DEFAULT_PARSE_CONFIG, ...config },
      });
    });
  }

  /**
   * Cleanup worker
   */
  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Export default instance
export default CSVToolkit;
