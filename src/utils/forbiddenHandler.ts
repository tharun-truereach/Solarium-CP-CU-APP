/**
 * Global 403 Forbidden error handler
 * Listens for api:forbidden events and handles them appropriately
 */

import { ROUTES } from '../routes/routes';

/**
 * 403 Error detail interface
 */
interface ForbiddenEventDetail {
  endpoint: string;
  error: any;
  message: string;
}

/**
 * Initialize global 403 error handler
 * Should be called once during app initialization
 */
export const initializeForbiddenHandler = (): void => {
  // Prevent multiple initializations
  if (typeof window === 'undefined') {
    return;
  }

  // Check if already initialized
  if ((window as any).__FORBIDDEN_HANDLER_INITIALIZED__) {
    return;
  }

  const handleForbiddenError = (event: CustomEvent<ForbiddenEventDetail>) => {
    const { endpoint, error, message } = event.detail;

    console.warn('🚫 403 Forbidden Access Detected:', {
      endpoint,
      message,
      timestamp: new Date().toISOString(),
    });

    // Show user-friendly toast message
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast({
        type: 'error',
        title: 'Access Denied',
        message:
          message || 'You do not have permission to access this resource',
        duration: 5000,
      });
    }

    // Log for analytics/monitoring
    if (process.env.NODE_ENV === 'production') {
      // Add your analytics/monitoring service here
      console.log('📊 Logging 403 error for monitoring:', {
        endpoint,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    }

    // Delay navigation to allow user to see the toast
    setTimeout(() => {
      // Redirect to access denied page
      window.location.href = ROUTES.ACCESS_DENIED;
    }, 1000);
  };

  // Add event listener for 403 errors
  window.addEventListener(
    'api:forbidden',
    handleForbiddenError as EventListener
  );

  // Mark as initialized
  (window as any).__FORBIDDEN_HANDLER_INITIALIZED__ = true;

  console.log('✅ Global 403 Forbidden handler initialized');
};

/**
 * Cleanup function for testing
 */
export const cleanupForbiddenHandler = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  // Remove event listener
  window.removeEventListener('api:forbidden', () => {});

  // Mark as not initialized
  delete (window as any).__FORBIDDEN_HANDLER_INITIALIZED__;
};

/**
 * Manually trigger forbidden error (for testing)
 */
export const triggerForbiddenError = (detail: ForbiddenEventDetail): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:forbidden', { detail }));
  }
};
