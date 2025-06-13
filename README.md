# Solarium Green Energy - Web Portal (WEBPRT)

A React 18 + TypeScript web application serving as the Admin and Key Account Manager interface for the Solarium Green Energy lead management platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm 8.x or higher

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd webprt-solarium

# Run automated setup
./scripts/dev-setup.sh

# Or manual setup:
npm install
cp .env.example .env.local
npm run dev
```

The application will be available at http://localhost:3000

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run preview` - Preview production build locally
- `npm run preview:staging` - Preview staging build
- `npm run preview:production` - Preview production build

### Building
- `npm run build` - Create production build
- `npm run build:development` - Create development build
- `npm run build:staging` - Create staging build
- `npm run build:production` - Create production build

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run typecheck` - Run TypeScript type checking
- `npm run validate` - Run all validation checks

### Testing
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests in CI mode

### Utility Scripts
- `npm run analyze` - Analyze bundle size
- `npm run clean` - Clean build directories and cache
- `./scripts/build.sh` - Build with environment options
- `./scripts/deploy.sh` - Deploy to staging/production
- `./scripts/health-check.sh` - Check application health
- `./scripts/env-check.sh` - Validate environment configuration

## 🏗️ Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── layouts/       # Layout components
│   ├── services/      # API services and utilities
│   ├── hooks/         # Custom React hooks
│   ├── routes/        # Routing configuration
│   ├── theme/         # Material UI theme
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── config/        # Configuration files
│   └── tests/         # Test utilities and helpers
├── scripts/           # Build and deployment scripts
├── docker/            # Docker configuration
└── .github/           # GitHub Actions workflows
```

## 🌍 Environment Configuration

The application supports multiple environments with different configurations:

### Environment Files
- `.env` - Default configuration
- `.env.development` - Development overrides
- `.env.staging` - Staging configuration
- `.env.production` - Production configuration
- `.env.local` - Local overrides (not committed)

### Key Environment Variables
```bash
# Environment identifier
REACT_APP_ENVIRONMENT=DEVELOPMENT|STAGING|PRODUCTION

# API Configuration
REACT_APP_API_BASE_URL=https://api.solarium.com

# Session timeout (minutes)
REACT_APP_SESSION_TIMEOUT_MIN=30

# Application metadata
REACT_APP_APP_NAME="Solarium Web Portal"
REACT_APP_APP_VERSION=1.0.0

# Feature flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG_MODE=false
```

### Environment Validation
```bash
# Check current environment configuration
./scripts/env-check.sh

# Check specific environment
./scripts/env-check.sh production
```

## 🔧 Technology Stack

- **React 18.x** - UI framework with concurrent features
- **TypeScript** - Type-safe JavaScript (strict mode enabled)
- **Material UI 5.x** - Component library with Solarium theme
- **Vite** - Fast build tool and development server
- **React Router 6.8.x** - Client-side routing
- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **React Testing Library** - Component testing utilities

## 🏗️ Building & Deployment

### Build Options
```bash
# Build for specific environment
./scripts/build.sh --env production --clean --analyze

# Quick builds
npm run build:development  # Development build
npm run build:staging     # Staging build  
npm run build:production  # Production build
```

### Deployment
```bash
# Deploy to staging
./scripts/deploy.sh --env staging

# Deploy to production (with confirmation)
./scripts/deploy.sh --env production

# Dry run (show what would be deployed)
./scripts/deploy.sh --env staging --dry-run
```

### Docker Deployment
```bash
# Build Docker image
docker build -f docker/Dockerfile -t solarium-webprt .

# Run with Docker Compose
docker-compose up -d

# Development mode
docker-compose --profile dev up
```

## 🧪 Testing

### Test Structure
```
src/
├── components/
│   └── ComponentName/
│       ├── ComponentName.tsx
│       └── ComponentName.test.tsx
├── pages/
│   └── PageName/
│       ├── PageName.tsx
│       └── PageName.test.tsx
└── tests/
    ├── setupTests.ts      # Jest setup
    ├── testUtils.ts       # Testing utilities  
    └── mockData/          # Mock data for tests
```

### Running Tests
```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode (no watch, with coverage)
npm run test:ci
```

### Test Types
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Component interaction testing
- **End-to-End Tests**: Full user workflow testing (future)

## 📊 Code Quality & Standards

### Code Quality Tools
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: React, TypeScript, and accessibility rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for pre-commit/pre-push validation
- **lint-staged**: Staged file linting and formatting

### Git Workflow
```bash
# Pre-commit: Runs automatically
- Lint and format staged files
- Type checking
- Basic validation

# Pre-push: Runs automatically  
- Full test suite
- Production build verification
```

### Code Standards
- Use functional components with hooks
- Follow TypeScript strict mode guidelines
- Maintain 80%+ test coverage
- Use semantic commit messages
- Follow Material UI design patterns

## 🚀 Performance & Optimization

### Build Optimization
- **Code Splitting**: Route-based and vendor chunk separation
- **Tree Shaking**: Unused code elimination
- **Minification**: Production code minification
- **Source Maps**: Configurable for each environment
- **Bundle Analysis**: Built-in bundle size analysis

### Runtime Performance
- **Lazy Loading**: Route-based component lazy loading
- **Memoization**: Strategic use of React.memo and useMemo
- **Virtual Scrolling**: For large data lists (future enhancement)
- **Image Optimization**: Responsive images and lazy loading

### Performance Monitoring
```bash
# Analyze bundle size
npm run analyze

# Check build output
./scripts/build.sh --env production --analyze
```

## 🔒 Security

### Security Features
- **Content Security Policy**: Configured in nginx and HTML
- **Environment Variable Validation**: Prevents configuration errors
- **Dependency Scanning**: Automated vulnerability scanning
- **Secure Headers**: XSS protection, CSRF prevention
- **HTTPS Enforcement**: Production HTTPS requirements

### Security Checks
```bash
# Run security audit
npm audit

# Check for high-severity vulnerabilities
npm audit --audit-level high

# Environment security validation
./scripts/env-check.sh production
```

## 🐳 Docker Support

### Docker Configuration
- **Multi-stage Build**: Optimized production images
- **Nginx Serving**: Production-ready web server
- **Health Checks**: Built-in application health monitoring
- **Environment Variables**: Runtime configuration support

### Docker Commands
```bash
# Build production image
docker build -f docker/Dockerfile -t solarium-webprt .

# Run production container
docker run -p 3000:80 \
  -e REACT_APP_API_BASE_URL=https://api.solarium.com \
  solarium-webprt

# Development with Docker Compose
docker-compose --profile dev up
```

## 🔧 Development

### Development Setup
```bash
# Automated setup
./scripts/dev-setup.sh

# Manual setup
npm install
cp .env.example .env.local
npm run dev
```

### Development Workflow
1. **Environment Setup**: Run dev-setup script or manual installation
2. **Feature Development**: Create feature branch and implement changes
3. **Testing**: Write and run tests for new functionality
4. **Quality Checks**: Run linting, formatting, and type checking
5. **Pull Request**: Submit PR with automated checks
6. **Review & Deploy**: Code review and deployment pipeline

### Debugging
- **Debug Mode**: Enable via `REACT_APP_ENABLE_DEBUG_MODE=true`
- **Source Maps**: Available in development and staging builds
- **Browser DevTools**: React Developer Tools recommended
- **Network Debugging**: API calls visible in browser network tab

## 📈 Monitoring & Health Checks

### Health Check Endpoints
- `/health` - Application health status
- `/` - Main application availability

### Health Check Script
```bash
# Check local development
./scripts/health-check.sh

# Check production
./scripts/health-check.sh --url https://app.solarium.com

# Verbose health check
./scripts/health-check.sh --url https://app.solarium.com --verbose
```

### Monitoring Integration
- **Azure Application Insights**: Application performance monitoring
- **Custom Metrics**: User interaction and error tracking
- **Uptime Monitoring**: External service health checks

## 🤝 Contributing

### Development Guidelines
1. **Code Standards**: Follow TypeScript and React best practices
2. **Testing**: Maintain test coverage above 80%
3. **Documentation**: Update README and component documentation
4. **Git Workflow**: Use feature branches and pull requests
5. **Security**: Follow secure coding guidelines

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run quality checks: `npm run validate`
4. Submit pull request with description
5. Address review comments
6. Merge after approval and CI passes

## 📄 License

© 2024 Solarium Green Energy. All rights reserved.

## 📞 Support

For technical support or questions:
- **Documentation**: Check component README files
- **Issues**: Create GitHub issue with reproduction steps
- **Development**: Contact the development team

---

**Environment Status:**
- 🟢 Production: https://app.solarium.com
- 🟡 Staging: https://staging.solarium.com  
- 🔵 Development: http://localhost:3000
