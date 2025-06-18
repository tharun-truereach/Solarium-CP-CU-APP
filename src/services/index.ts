/**
 * Services barrel file for Solarium Web Portal
 * Re-exports all service modules for easy importing
 */

// HTTP Client Services
export * from './http/axiosClient';
export * from './http/circuitBreaker';

// API Services (to be implemented in future tasks)
// export * from './api';
// export * from './auth';
// export * from './leads';
// export * from './quotations';
// export * from './commissions';
// export * from './users';

// Utility Services (to be implemented in future tasks)
// export * from './storage';
// export * from './notifications';
// export * from './analytics';
// export * from './validation';

// Currently no services to export - this file serves as a placeholder
// and will be populated as services are implemented in subsequent tasks
export {};
