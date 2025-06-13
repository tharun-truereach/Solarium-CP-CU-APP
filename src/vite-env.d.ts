/// <reference types="vite/client" />

/**
 * Type definitions for Vite environment variables
 * Extends ImportMetaEnv to include our custom environment variables
 */
interface ImportMetaEnv {
  REACT_APP_ENVIRONMENT: string;
  REACT_APP_API_BASE_URL: string;
  REACT_APP_SESSION_TIMEOUT_MIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
