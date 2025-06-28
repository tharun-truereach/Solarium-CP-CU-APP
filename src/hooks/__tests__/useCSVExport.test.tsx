/**
 * CSV Export Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCSVExport } from '../useCSVExport';
import { server } from '../../__mocks__/server';
import { rest } from 'msw';

// Mock the useToast hook
jest.mock('../useToast', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  }),
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'mock-blob-url');
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(global.URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock document methods
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
  setAttribute: jest.fn(),
  style: { visibility: '' },
};

const mockCreateElement = jest.fn(() => mockLink);
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

describe('useCSVExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateElement.mockReturnValue(mockLink);
  });

  it('should export leads successfully', async () => {
    const mockBlob = new Blob(['lead,data'], { type: 'text/csv' });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const { result } = renderHook(() => useCSVExport());

    expect(result.current.isExporting).toBe(false);

    await act(async () => {
      await result.current.exportLeads({ status: 'In Discussion' });
    });

    expect(result.current.isExporting).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/leads/export'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
      })
    );

    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
  });

  it('should handle export errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useCSVExport());

    await act(async () => {
      await result.current.exportLeads();
    });

    expect(result.current.error).toBeDefined();
  });

  it('should generate proper filename with timestamp', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/csv' });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const { result } = renderHook(() => useCSVExport());

    await act(async () => {
      await result.current.exportLeads();
    });

    expect(mockLink.download).toMatch(/^leads-\d{12}\.csv$/);
  });

  it('should handle server errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => useCSVExport());

    await act(async () => {
      await result.current.exportLeads();
    });

    expect(result.current.error).toBeDefined();
  });
});
