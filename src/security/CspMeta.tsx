/**
 * CSP Meta Tag Component for Development Preview
 * Provides Content Security Policy fallback via meta tags when server headers are not available
 * WARNING: This is for development/preview only - production must use server headers
 */
import React from 'react';
import { getCspNonce } from '../utils/csp';

interface CspMetaProps {
  /**
   * Whether to render the meta tags
   * @default true in development, false in production
   */
  enabled?: boolean;

  /**
   * Custom nonce value (for testing)
   */
  nonce?: string;

  /**
   * Whether to allow unsafe-inline (development only)
   * @default true in development, false in production
   */
  allowUnsafeInline?: boolean;

  /**
   * Additional CSP directives
   */
  additionalDirectives?: string;
}

/**
 * Generate CSP meta tag content with nonce
 */
const generateCspContent = (
  nonce: string,
  allowUnsafeInline = false,
  additionalDirectives = ''
): string => {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${allowUnsafeInline ? " 'unsafe-inline'" : ''} 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self' https: wss:" +
      (process.env.NODE_ENV === 'development'
        ? ' ws://localhost:* http://localhost:*'
        : ''),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
  ];

  if (additionalDirectives) {
    directives.push(additionalDirectives);
  }

  return directives.join('; ');
};

/**
 * CSP Meta Tag Component
 * Renders meta tags for Content Security Policy when server headers are not available
 */
export const CspMeta: React.FC<CspMetaProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  nonce,
  allowUnsafeInline = process.env.NODE_ENV === 'development',
  additionalDirectives,
}) => {
  // Don't render in production - server headers should be used instead
  if (!enabled) {
    return null;
  }

  const cspNonce = nonce || getCspNonce();
  const cspContent = generateCspContent(
    cspNonce,
    allowUnsafeInline,
    additionalDirectives
  );

  // Show warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ CSP Meta tags are being used. This is for development only. ' +
        'Production must use server headers for proper security.'
    );
  }

  return (
    <>
      {/* Content Security Policy */}
      <meta httpEquiv="Content-Security-Policy" content={cspContent} />

      {/* Other security headers via meta tags (fallback only) */}
      <meta httpEquiv="X-Frame-Options" content="DENY" />

      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

      <meta
        httpEquiv="Referrer-Policy"
        content="strict-origin-when-cross-origin"
      />

      {/* Development warning comment */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {/* eslint-disable-next-line react/no-danger */}
          <script
            nonce={cspNonce}
            dangerouslySetInnerHTML={{
              __html: `
                console.warn('🔒 CSP Meta tags loaded for development. Nonce: ${cspNonce}');
                console.warn('⚠️ Production should use server headers, not meta tags!');
              `,
            }}
          />
        </>
      )}
    </>
  );
};

/**
 * Hook to get CSP meta props for current environment
 */
export const useCspMeta = () => {
  const nonce = getCspNonce();

  return {
    nonce,
    enabled: process.env.NODE_ENV === 'development',
    allowUnsafeInline: process.env.NODE_ENV === 'development',
  };
};

export default CspMeta;
