/**
 * Type definitions test for lead bulk operations
 */

import type {
  BulkUpdateLeadsPayload,
  BulkReassignLeadsPayload,
  BulkOperationResponse,
  LeadImportPayload,
  LeadImportResponse,
  LeadExportQuery,
} from '../lead.types';

describe('Lead Bulk Types', () => {
  it('should have correct BulkUpdateLeadsPayload structure', () => {
    const payload: BulkUpdateLeadsPayload = {
      leadIds: ['LEAD-001', 'LEAD-002'],
      updates: {
        status: 'In Discussion',
        remarks: 'Test bulk update',
      },
    };

    expect(payload.leadIds).toHaveLength(2);
    expect(payload.updates.status).toBe('In Discussion');
  });

  it('should have correct BulkOperationResponse structure', () => {
    const response: BulkOperationResponse = {
      success: true,
      data: {
        total: 2,
        successful: 1,
        failed: 1,
        results: [
          { id: 'LEAD-001', success: true },
          { id: 'LEAD-002', success: false, error: 'Validation failed' },
        ],
      },
    };

    expect(response.success).toBe(true);
    expect(response.data.total).toBe(2);
    expect(response.data.results).toHaveLength(2);
  });

  it('should have correct LeadImportPayload structure', () => {
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const payload: LeadImportPayload = { file };

    expect(payload.file).toBeInstanceOf(File);
    expect(payload.file.name).toBe('test.csv');
  });
});
