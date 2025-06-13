/**
 * Build information module
 * Provides build-time information and metadata
 */

export interface BuildInfo {
  buildDate: string;
  buildMode: string;
  version: string;
  buildNumber: string;
  environment: string;
}

declare global {
  const __BUILD_DATE__: string;
  const __BUILD_MODE__: string;
}

/**
 * Get build information
 */
export const getBuildInfo = (): BuildInfo => {
  return {
    buildDate:
      typeof __BUILD_DATE__ !== 'undefined'
        ? __BUILD_DATE__
        : new Date().toISOString(),
    buildMode:
      typeof __BUILD_MODE__ !== 'undefined' ? __BUILD_MODE__ : 'development',
    version: process.env.REACT_APP_VERSION || '1.0.0',
    buildNumber: process.env.REACT_APP_BUILD_NUMBER || 'local',
    environment: process.env.REACT_APP_ENVIRONMENT || 'DEV',
  };
};

/**
 * Format build date for display
 */
export const formatBuildDate = (date: string): string => {
  return new Date(date).toLocaleString();
};

/**
 * Get build age in hours
 */
export const getBuildAge = (buildDate: string): number => {
  const now = new Date();
  const build = new Date(buildDate);
  return Math.floor((now.getTime() - build.getTime()) / (1000 * 60 * 60));
};
