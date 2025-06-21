/**
 * Vite Plugin for Security Headers in Development
 * Applies comprehensive security headers to development and preview servers
 * Ensures development environment matches production security posture
 */
import type { Plugin, Connect } from 'vite';

export interface SecurityHeadersOptions {
  /**
   * Whether to enable the plugin
   * @default true
   */
  enabled?: boolean;

  /**
   * Content Security Policy configuration
   */
  csp?: {
    /**
     * Whether to allow unsafe-inline (should only be true in development)
     * @default false
     */
    allowUnsafeInline?: boolean;

    /**
     * Whether to allow unsafe-eval (should always be false)
     * @default false
     */
    allowUnsafeEval?: boolean;

    /**
     * Additional CSP directives
     */
    additionalDirectives?: string[];

    /**
     * CSP report URI
     */
    reportUri?: string;
  };

  /**
   * HSTS configuration
   */
  hsts?: {
    /**
     * Max age in seconds
     * @default 31536000 (1 year)
     */
    maxAge?: number;

    /**
     * Include subdomains
     * @default true
     */
    includeSubDomains?: boolean;

    /**
     * Enable preload
     * @default true
     */
    preload?: boolean;
  };

  /**
   * Additional custom headers
   */
  customHeaders?: Record<string, string>;

  /**
   * Whether to log applied headers in development
   * @default true
   */
  logHeaders?: boolean;
}

/**
 * Default security headers configuration
 */
const DEFAULT_CONFIG: SecurityHeadersOptions = {
  enabled: true,
  csp: {
    allowUnsafeInline: false,
    allowUnsafeEval: false,
    additionalDirectives: [],
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  customHeaders: {},
  logHeaders: true,
};

/**
 * Generate Content Security Policy header value
 */
function generateCspHeader(
  cspConfig: Required<SecurityHeadersOptions>['csp'],
  isDevelopment: boolean
): string {
  const directives = [
    "default-src 'self'",

    // Script sources - more permissive in development
    `script-src 'self'${cspConfig.allowUnsafeInline ? " 'unsafe-inline'" : ''}${
      cspConfig.allowUnsafeEval ? " 'unsafe-eval'" : ''
    } https://cdn.jsdelivr.net https://unpkg.com`,

    // Style sources - allow unsafe-inline for Material-UI
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Font sources
    "font-src 'self' https://fonts.gstatic.com data:",

    // Image sources
    "img-src 'self' data: https:",

    // Connect sources - allow localhost in development
    "connect-src 'self' https: wss:" +
      (isDevelopment ? ' ws://localhost:* http://localhost:*' : ''),

    // Frame restrictions
    "frame-ancestors 'none'",

    // Base URI restriction
    "base-uri 'self'",

    // Form action restriction
    "form-action 'self'",

    // Object restrictions
    "object-src 'none'",

    // Media restrictions
    "media-src 'self'",
  ];

  // Add additional directives
  if (
    cspConfig.additionalDirectives &&
    cspConfig.additionalDirectives.length > 0
  ) {
    directives.push(...cspConfig.additionalDirectives);
  }

  // Add report URI if specified
  if (cspConfig.reportUri) {
    directives.push(`report-uri ${cspConfig.reportUri}`);
  }

  return directives.join('; ');
}

/**
 * Generate HSTS header value
 */
function generateHstsHeader(
  hstsConfig: Required<SecurityHeadersOptions>['hsts']
): string {
  let value = `max-age=${hstsConfig.maxAge}`;

  if (hstsConfig.includeSubDomains) {
    value += '; includeSubDomains';
  }

  if (hstsConfig.preload) {
    value += '; preload';
  }

  return value;
}

/**
 * Security headers middleware for Connect/Express
 */
function createSecurityHeadersMiddleware(
  config: Required<SecurityHeadersOptions>,
  isDevelopment: boolean
): Connect.NextHandleFunction {
  return (req, res, next) => {
    // Skip if disabled
    if (!config.enabled) {
      return next();
    }

    // Generate CSP header
    const cspHeader = generateCspHeader(config.csp, isDevelopment);
    res.setHeader('Content-Security-Policy', cspHeader);

    // HSTS header
    const hstsHeader = generateHstsHeader(config.hsts);
    res.setHeader('Strict-Transport-Security', hstsHeader);

    // Standard security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), ' +
        'display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), ' +
        'execution-while-out-of-viewport=(), fullscreen=(self), geolocation=(), gyroscope=(), ' +
        'layout-animations=(self), legacy-image-formats=(self), magnetometer=(), microphone=(), ' +
        'midi=(), navigation-override=(self), payment=(), picture-in-picture=(), ' +
        'publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(self), usb=(), ' +
        'web-share=(self), xr-spatial-tracking=()'
    );

    // Remove server signatures
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Add custom headers
    Object.entries(config.customHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Log applied headers in development
    if (config.logHeaders && isDevelopment) {
      console.log(`🔒 Security headers applied to: ${req.url}`);
    }

    next();
  };
}

/**
 * Vite plugin that applies security headers to development and preview servers
 */
export function securityHeadersPlugin(
  options: SecurityHeadersOptions = {}
): Plugin {
  // Merge with defaults
  const config = {
    enabled: options.enabled ?? DEFAULT_CONFIG.enabled!,
    csp: { ...DEFAULT_CONFIG.csp, ...options.csp },
    hsts: { ...DEFAULT_CONFIG.hsts, ...options.hsts },
    customHeaders: {
      ...DEFAULT_CONFIG.customHeaders,
      ...options.customHeaders,
    },
    logHeaders: options.logHeaders ?? DEFAULT_CONFIG.logHeaders!,
  };

  let isDevelopment = false;

  return {
    name: 'vite-security-headers',
    configResolved(resolvedConfig) {
      isDevelopment =
        resolvedConfig.command === 'serve' ||
        resolvedConfig.mode === 'development';

      if (config.enabled && config.logHeaders) {
        console.log(
          '🔒 Security Headers Plugin initialized for:',
          isDevelopment ? 'development' : 'preview'
        );
      }
    },

    configureServer(server) {
      if (!config.enabled) return;

      // Apply security headers middleware
      const middleware = createSecurityHeadersMiddleware(config, isDevelopment);
      server.middlewares.use(middleware);

      if (config.logHeaders) {
        console.log(
          '🔒 Security headers middleware applied to development server'
        );
      }
    },

    configurePreviewServer(server) {
      if (!config.enabled) return;

      // Apply security headers middleware to preview server
      const middleware = createSecurityHeadersMiddleware(config, false);
      server.middlewares.use(middleware);

      if (config.logHeaders) {
        console.log('🔒 Security headers middleware applied to preview server');
      }
    },
  };
}

export default securityHeadersPlugin;
