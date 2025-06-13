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