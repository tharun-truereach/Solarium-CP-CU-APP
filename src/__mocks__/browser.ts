/**
 * Mock Service Worker setup for browser
 * Provides mock API responses during development
 */

import { setupWorker } from 'msw';
import { authMockHandlers } from './authMockApi';
import { dashboardMockHandlers } from './dashboardApi';
import { profileMockHandlers } from './profileMockApi';
import { settingsMockHandlers } from './settingsMockApi';
import { leadMockHandlers } from './leadMockApi';

// Combine all mock handlers
export const handlers = [
  ...authMockHandlers,
  ...dashboardMockHandlers,
  ...profileMockHandlers,
  ...settingsMockHandlers,
  ...leadMockHandlers,
];

// Setup worker for browser
export const worker = setupWorker(...handlers);

/**
 * Start mock server worker
 */
export const startMockServer = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        waitUntilReady: true,
      });

      console.log('🎭 Mock Service Worker started successfully');
      console.log('📋 Available mock accounts:');
      console.log('   👨‍💼 Admin: admin@solarium.com / password123');
      console.log('   👩‍💼 KAM:   kam@solarium.com / password123');
      console.log('🔗 Intercepting requests to /api/v1/*');
      console.log(
        '📊 Mock leads available:',
        handlers.length,
        'handlers registered'
      );

      return true;
    } catch (error) {
      console.error('❌ Failed to start Mock Service Worker:', error);
      console.log('💡 Make sure mockServiceWorker.js is in the public folder');
      throw error;
    }
  }
  return false;
};
