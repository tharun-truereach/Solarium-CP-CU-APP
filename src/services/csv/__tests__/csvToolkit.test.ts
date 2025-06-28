/**
 * CSV Toolkit Tests
 */

import { CSVToolkit } from '../csvToolkit';
import type { Lead } from '../../../types/lead.types';

describe('CSVToolkit', () => {
  describe('validateFile', () => {
    it('should accept valid CSV files', () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      const result = CSVToolkit.validateFile(file);
      expect(result).toBeNull();
    });

    it('should reject non-CSV files', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = CSVToolkit.validateFile(file);
      expect(result).toBe('File must be a CSV file (.csv)');
    });

    it('should reject files over 10MB', () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'test.csv', { type: 'text/csv' });
      const result = CSVToolkit.validateFile(file);
      expect(result).toBe('File size must be less than 10MB');
    });

    it('should reject empty files', () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const result = CSVToolkit.validateFile(file);
      expect(result).toBe('File cannot be empty');
    });
  });

  describe('validateLeadData', () => {
    it('should validate complete lead data', () => {
      const data = [
        {
          customerName: 'John Doe',
          customerPhone: '9876543210',
          customerEmail: 'john@example.com',
          address: '123 Main St',
          state: 'Maharashtra',
          pinCode: '400001',
        },
      ];

      const result = CSVToolkit.validateLeadData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedData).toHaveLength(1);
      expect(result.validatedData[0]).toMatchObject({
        customerName: 'John Doe',
        customerPhone: '9876543210',
        customerEmail: 'john@example.com',
      });
    });

    it('should validate required fields', () => {
      const data = [
        {
          customerName: '',
          customerPhone: '',
          address: '',
          state: '',
          pinCode: '',
        },
      ];

      const result = CSVToolkit.validateLeadData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(5);
      expect(result.errors[0]).toMatchObject({
        row: 1,
        field: 'customerName',
        reason: 'customerName is required and cannot be empty',
      });
    });

    it('should validate phone number format', () => {
      const data = [
        {
          customerName: 'John Doe',
          customerPhone: 'invalid-phone',
          address: '123 Main St',
          state: 'Maharashtra',
          pinCode: '400001',
        },
      ];

      const result = CSVToolkit.validateLeadData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'customerPhone',
        reason:
          'Invalid phone number format. Must be a valid Indian mobile number',
      });
    });

    it('should validate email format', () => {
      const data = [
        {
          customerName: 'John Doe',
          customerPhone: '9876543210',
          customerEmail: 'invalid-email',
          address: '123 Main St',
          state: 'Maharashtra',
          pinCode: '400001',
        },
      ];

      const result = CSVToolkit.validateLeadData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'customerEmail',
        reason: 'Invalid email format',
      });
    });

    it('should validate PIN code format', () => {
      const data = [
        {
          customerName: 'John Doe',
          customerPhone: '9876543210',
          address: '123 Main St',
          state: 'Maharashtra',
          pinCode: '12345', // Invalid: only 5 digits
        },
      ];

      const result = CSVToolkit.validateLeadData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'pinCode',
        reason: 'PIN code must be exactly 6 digits',
      });
    });

    it('should validate date format', () => {
      const data = [
        {
          customerName: 'John Doe',
          customerPhone: '9876543210',
          address: '123 Main St',
          state: 'Maharashtra',
          pinCode: '400001',
          followUpDate: 'invalid-date',
        },
      ];

      const result = CSVToolkit.validateLeadData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        field: 'followUpDate',
        reason: 'Invalid date format. Use YYYY-MM-DD format',
      });
    });
  });

  describe('exportToCSV', () => {
    it('should generate CSV from lead data', () => {
      const leads: Lead[] = [
        {
          id: '1',
          leadId: 'LEAD-001',
          customerName: 'John Doe',
          customerPhone: '9876543210',
          customerEmail: 'john@example.com',
          address: '123 Main St',
          state: 'Maharashtra',
          pinCode: '400001',
          status: 'New Lead',
          origin: 'CP',
          createdBy: 'user1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        } as Lead,
      ];

      const csv = CSVToolkit.exportToCSV(leads);

      expect(csv).toContain('leadId,customerName,customerPhone');
      expect(csv).toContain('LEAD-001,John Doe,9876543210');
    });

    it('should handle custom field selection', () => {
      const leads: Lead[] = [
        {
          id: '1',
          leadId: 'LEAD-001',
          customerName: 'John Doe',
          customerPhone: '9876543210',
          status: 'New Lead',
        } as Lead,
      ];

      const csv = CSVToolkit.exportToCSV(leads, {
        fields: ['leadId', 'customerName'],
      });

      expect(csv).toContain('leadId,customerName');
      expect(csv).not.toContain('customerPhone');
    });

    it('should format dates correctly', () => {
      const leads: Lead[] = [
        {
          id: '1',
          leadId: 'LEAD-001',
          customerName: 'John Doe',
          createdAt: '2024-01-15T10:30:00Z',
        } as Lead,
      ];

      const csv = CSVToolkit.exportToCSV(leads, {
        fields: ['leadId', 'createdAt'],
      });

      expect(csv).toContain('2024-01-15');
    });
  });

  describe('getImportTemplate', () => {
    it('should return CSV template with headers and sample data', () => {
      const template = CSVToolkit.getImportTemplate();

      expect(template).toContain('customerName,customerPhone,customerEmail');
      expect(template).toContain('John Doe,9876543210,john.doe@example.com');
    });
  });

  describe('downloadCSV', () => {
    it('should trigger file download', () => {
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        setAttribute: jest.fn(),
        style: { visibility: '' },
      };

      const createElement = jest
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as any);
      const appendChild = jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation();
      const removeChild = jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation();

      // Mock URL methods
      const createObjectURL = jest
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue('blob-url');
      const revokeObjectURL = jest
        .spyOn(URL, 'revokeObjectURL')
        .mockImplementation();

      CSVToolkit.downloadCSV('test,data\n1,2', 'test.csv');

      expect(createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test.csv');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChild).toHaveBeenCalledWith(mockLink);
      expect(removeChild).toHaveBeenCalledWith(mockLink);
      expect(createObjectURL).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob-url');

      // Restore mocks
      createElement.mockRestore();
      appendChild.mockRestore();
      removeChild.mockRestore();
      createObjectURL.mockRestore();
      revokeObjectURL.mockRestore();
    });
  });
});
