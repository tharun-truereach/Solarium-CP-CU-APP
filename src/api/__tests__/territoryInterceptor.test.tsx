/**
 * Territory Parameter Injection Tests
 * Validates that RTK Query automatically injects territory parameters for KAM users
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { apiSlice } from '../apiSlice';
import { authSlice, login } from '../../store/slices/authSlice';
import type { User } from '../../types/user.types';

// Mock users
const mockAdminUser: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin',
  permissions: ['leads:read'],
  territories: [],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

const mockKamUser: User = {
  id: '2',
  email: 'kam@test.com',
  name: 'KAM User',
  role: 'kam',
  permissions: ['leads:read'],
  territories: ['North', 'East'],
  isActive: true,
  isVerified: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

// Create test endpoints
const testApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getLeads: builder.query<any[], { search?: string }>({
      query: params => ({
        url: '/leads',
        params,
      }),
    }),
    getQuotations: builder.query<any[], void>({
      query: () => '/quotations',
    }),
  }),
});

// Mock server to capture requests
let capturedRequests: any[] = [];

const server = setupServer(
  http.get('/api/v1/leads', ({ request }) => {
    const url = new URL(request.url);
    capturedRequests.push({
      url: request.url.toString(),
      searchParams: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries()),
    });

    return HttpResponse.json([
      { id: '1', name: 'Lead 1', territory: 'North' },
      { id: '2', name: 'Lead 2', territory: 'East' },
    ]);
  }),

  http.get('/api/v1/quotations', ({ request }) => {
    const url = new URL(request.url);
    capturedRequests.push({
      url: request.url.toString(),
      searchParams: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries()),
    });

    return HttpResponse.json([{ id: '1', name: 'Quote 1' }]);
  })
);

// Create test store
function createTestStore(user: User | null = null) {
  const store = configureStore({
    reducer: {
      auth: authSlice.reducer,
      api: apiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });

  if (user) {
    store.dispatch(
      login({
        user,
        token: 'test-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    );
  }

  // Make store available globally for API slice
  (window as any).__STORE__ = store;

  return store;
}

beforeEach(() => {
  server.listen();
  capturedRequests = [];
});

afterEach(() => {
  server.resetHandlers();
  delete (window as any).__STORE__;
});

describe('Territory Parameter Injection', () => {
  describe('Admin User Requests', () => {
    it('should not inject territory parameters for admin users', async () => {
      const store = createTestStore(mockAdminUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => testApiSlice.useGetLeadsQuery({ search: 'test' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check captured request
      expect(capturedRequests).toHaveLength(1);
      const request = capturedRequests[0];

      // Admin requests should not have territory parameters
      expect(request.searchParams).toEqual({ search: 'test' });
      expect(request.searchParams).not.toHaveProperty('territories');

      // Should have territory headers indicating full access
      expect(request.headers['x-territory-access']).toBe('all');
    });

    it('should not modify existing parameters for admin', async () => {
      const store = createTestStore(mockAdminUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => testApiSlice.useGetLeadsQuery({ search: 'admin test' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const request = capturedRequests[0];
      expect(request.searchParams).toEqual({ search: 'admin test' });
    });
  });

  describe('KAM User Requests', () => {
    it('should inject territory parameters for KAM users', async () => {
      const store = createTestStore(mockKamUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => testApiSlice.useGetLeadsQuery({ search: 'test' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check captured request
      expect(capturedRequests).toHaveLength(1);
      const request = capturedRequests[0];

      // KAM requests should have territory parameters injected
      expect(request.searchParams).toEqual({
        search: 'test',
        territories: 'North,East',
      });

      // Should have territory headers indicating filtered access
      expect(request.headers['x-territory-access']).toBe('filtered');
      expect(request.headers['x-user-territories']).toBe('North,East');
    });

    it('should inject territory parameters even for empty queries', async () => {
      const store = createTestStore(mockKamUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => testApiSlice.useGetQuotationsQuery(),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const request = capturedRequests[0];
      expect(request.searchParams).toEqual({
        territories: 'North,East',
      });
    });

    it('should preserve existing parameters and add territories', async () => {
      const store = createTestStore(mockKamUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => testApiSlice.useGetLeadsQuery({ search: 'kam test' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const request = capturedRequests[0];
      expect(request.searchParams).toEqual({
        search: 'kam test',
        territories: 'North,East',
      });
    });
  });

  describe('Unauthenticated Requests', () => {
    it('should not inject territory parameters for unauthenticated users', async () => {
      const store = createTestStore(null);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => testApiSlice.useGetLeadsQuery({ search: 'test' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isError || result.current.isSuccess).toBe(true);
      });

      if (capturedRequests.length > 0) {
        const request = capturedRequests[0];
        expect(request.searchParams).toEqual({ search: 'test' });
        expect(request.searchParams).not.toHaveProperty('territories');
      }
    });
  });

  describe('Territory Headers', () => {
    it('should set correct headers for admin users', async () => {
      const store = createTestStore(mockAdminUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => testApiSlice.useGetLeadsQuery({}), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const request = capturedRequests[0];
      expect(request.headers['x-territory-access']).toBe('all');
      expect(request.headers['authorization']).toBe('Bearer test-token');
    });

    it('should set correct headers for KAM users', async () => {
      const store = createTestStore(mockKamUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => testApiSlice.useGetLeadsQuery({}), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const request = capturedRequests[0];
      expect(request.headers['x-territory-access']).toBe('filtered');
      expect(request.headers['x-user-territories']).toBe('North,East');
      expect(request.headers['authorization']).toBe('Bearer test-token');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle KAM users with no territories', async () => {
      const kamWithNoTerritories = {
        ...mockKamUser,
        territories: [],
      };

      const store = createTestStore(kamWithNoTerritories);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => testApiSlice.useGetLeadsQuery({}), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const request = capturedRequests[0];
      expect(request.searchParams).toEqual({
        territories: '', // Empty string for no territories
      });
    });

    it('should not duplicate territory parameters', async () => {
      const store = createTestStore(mockKamUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      // Make multiple requests
      const { result: result1 } = renderHook(
        () => testApiSlice.useGetLeadsQuery({ search: 'test1' }),
        { wrapper }
      );

      const { result: result2 } = renderHook(
        () => testApiSlice.useGetLeadsQuery({ search: 'test2' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess || result1.current.isError).toBe(true);
        expect(result2.current.isSuccess || result2.current.isError).toBe(true);
      });

      // Each request should have territories parameter only once
      capturedRequests.forEach(request => {
        const url = new URL(request.url);
        const territoriesParams = url.searchParams.getAll('territories');
        expect(territoriesParams).toHaveLength(1);
        expect(territoriesParams[0]).toBe('North,East');
      });
    });
  });
});
