# Build Configuration Guide

This document explains the build configuration and deployment process for the Solarium Web Portal.

## Environment Configuration

The application supports three environments:

### Development (DEV)
- Local development with hot reloading
- Extended session timeouts for convenience
- Debug tools enabled
- Mock authentication available

### Staging (STAGING)
- Production-like environment for testing
- Production session timeouts
- Limited debug capabilities
- Real API endpoints

### Production (PROD)
- Optimized build for production
- Security-focused configuration
- Minimal logging
- Performance optimizations

## Environment Variables

All environment variables must be prefixed with `REACT_APP_` to be accessible in the browser.

### Required Variables
- `REACT_APP_ENVIRONMENT`: Environment identifier (DEV, STAGING, PROD)
- `REACT_APP_API_BASE_URL`: Backend API URL

### Optional Variables
- `REACT_APP_SESSION_TIMEOUT_MIN`: Session timeout in minutes (default: 30)
- `REACT_APP_SESSION_WARNING_MIN`: Warning time before timeout (default: 5)
- `REACT_APP_ENABLE_DEBUG_TOOLS`: Enable debug tools (default: false)
- `REACT_APP_SENTRY_DSN`: Sentry error reporting DSN
- `REACT_APP_ANALYTICS_ID`: Analytics tracking ID

## Build Commands

### Development
```bash
# Start development server
npm run dev

# Start with staging configuration
npm run dev:staging
```

### Building
```bash
# Build for production (default)
npm run build

# Build for specific environment
npm run build:dev
npm run build:staging
npm run build:prod

# Analyze bundle size
npm run build:analyze
```

### Testing Builds
```bash
# Preview production build
npm run preview

# Preview staging build
npm run preview:staging
```

### Quality Checks
```bash
# Run all quality checks
npm run validate

# Individual checks
npm run type-check
npm run lint
npm run test:ci
npm run size-check
```

## Bundle Size Limits

The application enforces bundle size limits:
- JavaScript: 1MB (gzipped)
- CSS: 50KB (gzipped)

Use `npm run build:analyze` to analyze bundle composition.

## Deployment

### Manual Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### CI/CD Pipeline

The project includes a GitHub Actions workflow that:
1. Runs tests and quality checks
2. Builds for all environments
3. Checks bundle sizes
4. Deploys to staging/production based on branch

### Environment Files

Create environment-specific files:
- `.env.development` - Development configuration
- `.env.staging` - Staging configuration
- `.env.production` - Production configuration
- `.env.local` - Local overrides (ignored by git)

## Performance Optimization

The build process includes:
- Code splitting by vendor/feature
- Tree shaking for unused code
- Asset optimization
- Source map generation (dev/staging only)
- Bundle compression

## Environment Banner

In development and staging, an environment banner displays:
- Current environment name
- Version information
- Build details
- Configuration summary

The banner can be dismissed and is automatically hidden in production.

## Troubleshooting

### Common Issues

1. **Environment variables not loaded**
   - Ensure variables start with `REACT_APP_`
   - Check the correct `.env` file is present
   - Restart the development server

2. **Bundle size too large**
   - Use `npm run build:analyze` to identify large dependencies
   - Consider code splitting or lazy loading
   - Remove unused dependencies

3. **Build fails**
   - Run `npm run type-check` to identify TypeScript errors
   - Check `npm run lint` for code quality issues
   - Ensure all environment variables are valid

## Security Headers Implementation

### Overview
The Solarium Web Portal implements comprehensive security headers to protect against common web vulnerabilities including XSS, clickjacking, CSRF, and content injection attacks.

### Security Headers Implemented

#### 1. Content Security Policy (CSP)
- **Purpose**: Prevents XSS attacks by controlling resource loading
- **Implementation**: Server headers + meta tag fallback (DEV only)
- **Policy**: Restrictive whitelist approach

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' https://cdn.jsdelivr.net; 
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
  font-src 'self' https://fonts.gstatic.com data:; 
  img-src 'self' data: https:; 
  connect-src 'self' https: wss:; 
  frame-ancestors 'none'; 
  base-uri 'self'; 
  form-action 'self'; 
  object-src 'none'
```

#### 2. HTTP Strict Transport Security (HSTS)
- **Purpose**: Enforces HTTPS connections
- **Configuration**: 1 year max-age with subdomain inclusion
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### 3. X-Frame-Options
- **Purpose**: Prevents clickjacking attacks
- **Value**: `DENY` - completely blocks framing

#### 4. X-Content-Type-Options
- **Purpose**: Prevents MIME type sniffing
- **Value**: `nosniff`

#### 5. Referrer-Policy
- **Purpose**: Controls referrer information disclosure
- **Value**: `strict-origin-when-cross-origin`

#### 6. Permissions-Policy
- **Purpose**: Controls browser feature access
- **Configuration**: Restrictive policy blocking dangerous features

### Implementation Architecture

#### Production (Docker/Nginx)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client        │───▶│  Nginx Proxy     │───▶│  React SPA      │
│   Browser       │    │  + Security      │    │  (Static Files) │
│                 │    │    Headers       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ security.conf    │
                       │ - CSP headers    │
                       │ - HSTS headers   │
                       │ - Frame options  │
                       └──────────────────┘
```

#### Development (Vite Dev Server)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client        │───▶│  Vite Dev Server │───▶│  React SPA      │
│   Browser       │    │  + Plugin        │    │  (Hot Reload)   │
│                 │    │    Middleware    │    │                 │
└──────────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ vite-plugin-security-   │
                    │ headers.ts              │
                    │ - Runtime header        │
                    │   injection             │
                    │ - CSP Meta fallback     │
                    └─────────────────────────┘
```

### Environment-Specific Considerations

#### Development vs Production
| Aspect | Development | Production |
|--------|-------------|------------|
| CSP Enforcement | Relaxed (unsafe-inline allowed) | Strict |
| Header Source | Vite Plugin + Meta Tags | Nginx Server Headers |
| localhost Connections | Allowed | Blocked |
| Debug Logging | Enabled | Disabled |

⚠️ **Important**: Meta tag CSP is a fallback for development only. Production MUST use server headers for proper security.

### Build Process

#### 1. Development Build
```bash
npm run dev
# - Vite plugin applies security headers
# - Meta CSP tags injected as fallback
# - Localhost connections allowed for HMR
```

#### 2. Production Build
```bash
npm run build
# - Static files generated
# - Meta tags removed (server headers used)
# - Docker image includes nginx security.conf
```

#### 3. Docker Build
```bash
docker build -t solarium-portal .
# - Nginx configuration includes security.conf
# - Security headers applied at proxy level
# - Static files served with proper headers
```

### Security Verification

#### 1. Manual Testing
```bash
# Check headers in development
curl -I http://localhost:3000

# Check headers in production
curl -I https://portal.solarium.com
```

#### 2. Automated Testing
```bash
# Run security header tests
npm run test src/security/__tests__/headers.test.ts

# Full security scan
npm run security:scan
```

#### 3. External Validation
- [SecurityHeaders.com](https://securityheaders.com) - Should achieve A+ rating
- [Mozilla Observatory](https://observatory.mozilla.org) - Should score 100+
- OWASP ZAP baseline scan - Should report 0 high/medium alerts

### Troubleshooting

#### Common Issues

1. **CSP Violations in Console**
   - Check script/style sources are whitelisted
   - Verify nonce implementation for inline content
   - Material-UI requires 'unsafe-inline' for styles

2. **HSTS Not Working**
   - Ensure HTTPS is properly configured
   - Check browser HSTS cache
   - Verify preload list submission

3. **Frame-Options Blocking Legitimate Content**
   - Review X-Frame-Options policy
   - Consider CSP frame-ancestors as alternative

#### Debug Commands
```bash
# Test CSP policy
npm run test:csp

# Validate all security headers
npm run test:security

# Check for header conflicts
npm run debug:headers
```

### Maintenance

#### Regular Tasks
1. **Monthly**: Review CSP violation reports
2. **Quarterly**: Update external resource domains
3. **Annually**: Review and tighten security policies

#### Updates Required When:
- Adding new external dependencies (CDN, fonts, etc.)
- Integrating third-party services (analytics, chat, etc.)
- Changing hosting infrastructure

### References
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/) 