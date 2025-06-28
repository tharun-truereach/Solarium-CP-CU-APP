/**
 * Integration test for lead bulk endpoints
 * Tests the hooks are properly exported and can be imported
 */

import {
  useBulkUpdateLeadsMutation,
  useBulkReassignLeadsMutation,
  useImportLeadsMutation,
  useExportLeadsQuery,
} from '../leadEndpoints';

describe('Lead Bulk Endpoints Integration', () => {
  it('should export all bulk operation hooks', () => {
    // Test that all hooks are defined and importable
    expect(useBulkUpdateLeadsMutation).toBeDefined();
    expect(useBulkReassignLeadsMutation).toBeDefined();
    expect(useImportLeadsMutation).toBeDefined();
    expect(useExportLeadsQuery).toBeDefined();

    // Test that they are functions (hooks)
    expect(typeof useBulkUpdateLeadsMutation).toBe('function');
    expect(typeof useBulkReassignLeadsMutation).toBe('function');
    expect(typeof useImportLeadsMutation).toBe('function');
    expect(typeof useExportLeadsQuery).toBe('function');
  });
});
