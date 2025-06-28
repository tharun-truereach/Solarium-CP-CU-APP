/**
 * Tests for useChannelPartners hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useChannelPartners } from '../useChannelPartners';

describe('useChannelPartners', () => {
  it('should load channel partners on mount', async () => {
    const { result } = renderHook(() => useChannelPartners());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.channelPartners).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.channelPartners.length).toBeGreaterThan(0);
    expect(result.current.activeChannelPartners.length).toBeGreaterThan(0);
  });

  it('should filter active channel partners', async () => {
    const { result } = renderHook(() => useChannelPartners());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const allCPs = result.current.channelPartners;
    const activeCPs = result.current.activeChannelPartners;

    expect(activeCPs.length).toBeLessThanOrEqual(allCPs.length);
    expect(activeCPs.every(cp => cp.status === 'active')).toBe(true);
  });

  it('should find channel partner by ID', async () => {
    const { result } = renderHook(() => useChannelPartners());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstCP = result.current.channelPartners[0];
    if (firstCP) {
      const foundCP = result.current.getChannelPartnerById(firstCP.id);
      expect(foundCP).toEqual(firstCP);
    }
  });

  it('should return undefined for non-existent CP ID', async () => {
    const { result } = renderHook(() => useChannelPartners());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const foundCP = result.current.getChannelPartnerById('NON-EXISTENT');
    expect(foundCP).toBeUndefined();
  });
});
