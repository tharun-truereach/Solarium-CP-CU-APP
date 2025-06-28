/**
 * Unit tests for lead status matrix
 */

import {
  getValidNextStates,
  isValidStatusTransition,
  getRequiredFieldsForTransition,
  isTerminalStatus,
  getAllLeadStatuses,
} from '../leadStatusMatrix';

describe('Lead Status Matrix', () => {
  describe('getValidNextStates', () => {
    it('returns correct next states for New Lead', () => {
      const nextStates = getValidNextStates('New Lead');
      expect(nextStates).toContain('In Discussion');
      expect(nextStates).toContain('Physical Meeting Assigned');
      expect(nextStates).toContain('Not Responding');
      expect(nextStates).toContain('Not Interested');
      expect(nextStates).toContain('Other Territory');
    });

    it('returns empty array for terminal states', () => {
      expect(getValidNextStates('Executed')).toEqual([]);
      expect(getValidNextStates('Not Responding')).toEqual([]);
      expect(getValidNextStates('Not Interested')).toEqual([]);
      expect(getValidNextStates('Other Territory')).toEqual([]);
    });

    it('returns Won only for Customer Accepted', () => {
      const nextStates = getValidNextStates('Customer Accepted');
      expect(nextStates).toEqual(['Won']);
    });
  });

  describe('isValidStatusTransition', () => {
    it('validates correct transitions', () => {
      expect(isValidStatusTransition('New Lead', 'In Discussion')).toBe(true);
      expect(isValidStatusTransition('In Discussion', 'Won')).toBe(true);
      expect(isValidStatusTransition('Won', 'Pending at Solarium')).toBe(true);
    });

    it('rejects invalid transitions', () => {
      expect(isValidStatusTransition('New Lead', 'Executed')).toBe(false);
      expect(isValidStatusTransition('Executed', 'New Lead')).toBe(false);
      expect(isValidStatusTransition('Won', 'In Discussion')).toBe(false);
    });
  });

  describe('getRequiredFieldsForTransition', () => {
    it('returns required fields for valid transitions', () => {
      const fields = getRequiredFieldsForTransition(
        'New Lead',
        'In Discussion'
      );
      expect(fields?.remarks).toBe(true);
      expect(fields?.followUpDate).toBe(true);
    });

    it('returns quotation requirement for Won transition', () => {
      const fields = getRequiredFieldsForTransition('Customer Accepted', 'Won');
      expect(fields?.quotationRef).toBe(true);
      expect(fields?.remarks).toBe(true);
    });

    it('returns token requirement for Under Execution transition', () => {
      const fields = getRequiredFieldsForTransition(
        'Under Execution',
        'Executed'
      );
      expect(fields?.tokenNumber).toBe(true);
      expect(fields?.remarks).toBe(true);
    });

    it('returns undefined for invalid transitions', () => {
      const fields = getRequiredFieldsForTransition('New Lead', 'Executed');
      expect(fields).toBeUndefined();
    });
  });

  describe('isTerminalStatus', () => {
    it('identifies terminal statuses correctly', () => {
      expect(isTerminalStatus('Executed')).toBe(true);
      expect(isTerminalStatus('Not Responding')).toBe(true);
      expect(isTerminalStatus('Not Interested')).toBe(true);
      expect(isTerminalStatus('Other Territory')).toBe(true);
    });

    it('identifies non-terminal statuses correctly', () => {
      expect(isTerminalStatus('New Lead')).toBe(false);
      expect(isTerminalStatus('In Discussion')).toBe(false);
      expect(isTerminalStatus('Won')).toBe(false);
    });
  });

  describe('getAllLeadStatuses', () => {
    it('returns all possible statuses', () => {
      const allStatuses = getAllLeadStatuses();
      expect(allStatuses).toContain('New Lead');
      expect(allStatuses).toContain('Customer Accepted');
      expect(allStatuses).toContain('Executed');
      expect(allStatuses.length).toBeGreaterThan(10);
    });
  });
});
