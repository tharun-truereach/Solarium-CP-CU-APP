/**
 * Mock Service Worker browser setup
 * Configures MSW for development environment
 */
import { setupWorker } from 'msw';
import { authMockHandlers } from './authMockApi';
import { dashboardMockHandlers } from './dashboardApi';

// Combine all mock handlers
const handlers = [...authMockHandlers, ...dashboardMockHandlers];

// Setup the worker
export const worker = setupWorker(...handlers);

// Start worker in development
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

      return true;
    } catch (error) {
      console.error('❌ Failed to start Mock Service Worker:', error);
      console.log('💡 Make sure mockServiceWorker.js is in the public folder');
      throw error;
    }
  }
  return false;
};
