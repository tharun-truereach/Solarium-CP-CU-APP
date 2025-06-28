/**
 * Tests for useCSVImport hook
 */

import { renderHook, act } from '@testing-library/react';
import { useCSVImport } from '../useCSVImport';

// Mock Papa Parse
jest.mock('papaparse', () => ({
  parse: jest.fn(),
}));

const mockConfig = {
  requiredColumns: [
    'customerName',
    'customerPhone',
    'address',
    'state',
    'pinCode',
  ],
  optionalColumns: ['customerEmail', 'services'],
  maxRows: 50,
};

describe('useCSVImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useCSVImport(mockConfig));

    expect(result.current.file).toBeNull();
    expect(result.current.parsedData).toBeNull();
    expect(result.current.validationErrors).toEqual([]);
    expect(result.current.isValidFile).toBe(false);
    expect(result.current.isProcessing).toBe(false);
  });

  it('should clear data when clearData is called', () => {
    const { result } = renderHook(() => useCSVImport(mockConfig));

    act(() => {
      result.current.clearData();
    });

    expect(result.current.file).toBeNull();
    expect(result.current.parsedData).toBeNull();
    expect(result.current.validationErrors).toEqual([]);
  });

  it('should create download link when downloadTemplate is called', () => {
    // Mock DOM methods
    const mockCreateElement = jest.spyOn(document, 'createElement');
    const mockAppendChild = jest.spyOn(document.body, 'appendChild');
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild');
    const mockClick = jest.fn();

    const mockLink = {
      setAttribute: jest.fn(),
      style: { visibility: '' },
      click: mockClick,
    } as any;

    mockCreateElement.mockReturnValue(mockLink);
    mockAppendChild.mockImplementation(() => mockLink);
    mockRemoveChild.mockImplementation(() => mockLink);

    const { result } = renderHook(() => useCSVImport(mockConfig));

    act(() => {
      result.current.downloadTemplate();
    });

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalledTimes(1);

    // Cleanup
    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });
});
