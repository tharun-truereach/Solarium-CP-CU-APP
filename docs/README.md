# Solarium Web Portal

A comprehensive lead management platform for solar product sales, built with React, TypeScript, and Material-UI.

## 🌟 Features

### Core Functionality
- **Lead Management**: Capture and track leads from multiple channels
- **Quotation System**: Generate and manage solar system quotations
- **Commission Tracking**: Monitor channel partner commissions
- **User Management**: Role-based access control (Admin, KAM, CP, Customer)
- **Territory Management**: Geographic territory-based data filtering
- **Settings Management**: Real-time system configuration and feature flags

### Technology Stack
- **Frontend**: React 18, TypeScript, Material-UI 5
- **State Management**: Redux Toolkit, RTK Query
- **Routing**: React Router 6
- **Authentication**: JWT with refresh tokens
- **Testing**: Vitest, Testing Library, MSW
- **Build**: Vite, ESLint, Prettier

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ LTS
- npm 9+
- Git 2.4+

### Installation
```bash
# Clone repository
git clone <repository-url>
cd Solarium-CP-CU-APP

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
Copy `.env.example` to `.env` and configure:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.solarium.com
VITE_ENVIRONMENT=DEV

# Authentication
VITE_SESSION_TIMEOUT_MIN=30
VITE_CRYPTO_SECRET=your-32-character-secret-key

# Features
VITE_ENABLE_DEBUG_TOOLS=true
```

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:security   # Security vulnerability scan
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking

# Testing
npm run test            # Run unit tests
npm run test:coverage   # Test coverage report
npm run test:security   # Security regression tests
npm run test:ui         # Visual test runner
```

## 🏗️ Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs)
│   ├── dashboard/      # Dashboard-specific components
│   ├── settings/       # Settings management components
│   └── error/          # Error handling components
├── pages/              # Route-level page components
├── hooks/              # Custom React hooks
├── store/              # Redux store configuration
│   ├── slices/         # Redux slices
│   └── middleware/     # Custom middleware
├── api/                # RTK Query API definitions
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── routes/             # React Router configuration
```

### State Management
- **Redux Toolkit**: Core state management
- **RTK Query**: Server state and caching
- **Redux Persist**: Encrypted local persistence
- **React Context**: Feature flags and UI state

### Security Features
- **Encrypted Storage**: AES-256 encryption for persisted data
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Granular permission system
- **CSP Compliance**: Content Security Policy adherent
- **Input Validation**: Client and server-side validation

## 🎛️ Settings Management

The Settings Management module provides administrators with comprehensive system configuration capabilities:

### Key Features
- **Real-time Configuration**: Update settings without application restart
- **Feature Flags**: Toggle application features dynamically
- **Audit Trail**: Complete change history with user attribution
- **Validation**: Input validation with immediate feedback
- **Access Control**: Admin-only access with role enforcement

### Configuration Categories

#### General Settings
- Session timeout (5-1440 minutes)
- Token expiry (15-4320 minutes)
- Notification preferences

#### Feature Flags
```typescript
{
  "ADVANCED_REPORTING": boolean,    // Enable advanced analytics
  "ANALYTICS": boolean,             // Usage tracking
  "DEBUG_MODE": boolean,            // Debug information (restricted)
  "BULK_OPERATIONS": boolean        // Bulk data operations
}
```

#### Thresholds
```typescript
{
  "MAX_LEADS_PER_PAGE": number,     // Pagination limits
  "SESSION_WARNING_MIN": number,    // Session warning timing
  "MAX_FILE_SIZE_MB": number        // Upload limits
}
```

### Usage Example
```typescript
import { useUpdateSettingsMutation } from '../api/endpoints/settingsEndpoints';

const [updateSettings] = useUpdateSettingsMutation();

const handleSave = async () => {
  await updateSettings({
    sessionTimeoutMin: 45,
    featureFlags: {
      ADVANCED_REPORTING: true
    }
  });
};
```

### API Endpoints
- `GET /api/v1/settings` - Retrieve current settings
- `PATCH /api/v1/settings` - Update settings (Admin only)
- `GET /api/v1/settings/audit` - Audit log with pagination

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access, user management, settings
- **KAM (Key Account Manager)**: Territory-based lead management
- **CP (Channel Partner)**: Lead creation and quotation generation
- **Customer**: Self-service portal access

### Territory-Based Access
Users can be assigned to specific territories:
```typescript
type Territory = 'North' | 'South' | 'East' | 'West' | 'Central' | 
                'Northeast' | 'Northwest' | 'Southeast' | 'Southwest';
```

Data filtering automatically applies based on user territories.

### Permission System
```typescript
type Permission = 
  | 'leads:read' | 'leads:write' | 'leads:delete'
  | 'quotations:read' | 'quotations:write' | 'quotations:approve'
  | 'settings:read' | 'settings:write'
  | 'users:read' | 'users:write' | 'users:delete';
```

## 🧪 Testing

### Test Coverage Requirements
- **Overall**: ≥80% coverage
- **Business Logic**: ≥85% coverage
- **API Endpoints**: ≥80% coverage
- **Components**: ≥75% coverage

### Testing Strategy
```bash
# Unit Tests
npm run test src/components/
npm run test src/hooks/
npm run test src/utils/

# Integration Tests
npm run test src/__tests__/integration/

# E2E Tests
npm run test src/__tests__/e2e/

# Security Tests
npm run test:security
```

### Test Categories
- **Unit Tests**: Component rendering, hook functionality, utility functions
- **Integration Tests**: API communication, state management, user workflows
- **E2E Tests**: Complete user journeys across multiple components
- **Security Tests**: Access control, input validation, vulnerability scanning

## 🔒 Security

### Security Measures
- **Content Security Policy**: Strict CSP headers
- **Input Sanitization**: XSS prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API abuse prevention
- **Audit Logging**: Security event tracking

### Security Testing
```bash
# Run security scan
npm run lint:security

# Test access controls
npm run test src/routes/__tests__/
npm run test src/api/__tests__/security/

# CSP compliance check
npm run test tests/security/
```

## 📊 Performance

### Performance Optimizations
- **Code Splitting**: Lazy loading with React.lazy
- **Caching**: RTK Query automatic caching
- **Virtualization**: Large list rendering optimization
- **Memoization**: Expensive calculation caching
- **Bundle Optimization**: Tree shaking and minification

### Performance Monitoring
```typescript
// Development performance utilities
if (process.env.NODE_ENV === 'development') {
  // React DevTools Profiler
  import('react-dom/profiling');
  
  // Performance measurements
  performance.mark('app-start');
}
```

## 🌐 API Integration

### RTK Query Configuration
```typescript
// Base API configuration
const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: enhancedFetchBaseQuery,
  tagTypes: ['Settings', 'User', 'Lead', 'Quotation'],
  endpoints: () => ({}),
});

// Feature-specific endpoints
export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<SystemSettings, void>(),
    updateSettings: builder.mutation<SystemSettings, Partial<SystemSettings>>(),
  }),
});
```

### Error Handling
- **Automatic Retry**: Failed requests with exponential backoff
- **Token Refresh**: Automatic JWT token renewal
- **Global Error Handling**: Centralized error management
- **User Feedback**: Toast notifications for errors and success

## 🚀 Deployment

### Build Configuration
```bash
# Production build
npm run build

# Build verification
npm run preview
npm run test:coverage
npm run lint:security
```

### Environment Variables
```bash
# Production environment
VITE_API_BASE_URL=https://api.solarium.com
VITE_ENVIRONMENT=PROD
VITE_SESSION_TIMEOUT_MIN=30
VITE_CRYPTO_SECRET=production-secret-key
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 📈 Monitoring

### Application Monitoring
- **Error Tracking**: Global error boundary with reporting
- **Performance Metrics**: Core Web Vitals monitoring
- **User Analytics**: Feature usage tracking (when enabled)
- **API Monitoring**: Request/response time tracking

### Development Tools
```typescript
// Debug utilities (development only)
window.__APP_DEBUG__ = {
  store: store.getState(),
  api: apiSlice.util,
  performance: performance.getEntriesByType('navigation'),
};
```

## 🤝 Contributing

### Development Workflow
1. Create feature branch: `feat/TASK-ID-description`
2. Implement changes with tests
3. Run quality checks: `npm run lint && npm run test`
4. Create pull request with detailed description
5. Code review and approval
6. Squash merge to main

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Security and best practices
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages

### Pull Request Checklist
- [ ] All tests passing
- [ ] Code coverage ≥80%
- [ ] Security scan clean
- [ ] TypeScript errors resolved
- [ ] Documentation updated
- [ ] Manual testing completed

## 📚 Additional Documentation

- [Settings Management Guide](./SETTINGS.md)
- [API Territory Documentation](./API_TERRITORY.md)
- [Testing Guidelines](./TESTING.md)
- [Build Configuration](./BUILD.md)
- [QA Pipeline](./QA_PIPELINE.md)

## 🆘 Support

### Getting Help
- **Documentation**: Check relevant docs in `/docs` folder
- **Issues**: Create GitHub issue with detailed description
- **Security**: Report security issues privately
- **Features**: Submit feature requests through proper channels

### Common Issues
1. **Settings not loading**: Verify admin role and authentication
2. **Build failures**: Check Node.js version and dependencies
3. **Test failures**: Ensure MSW handlers are properly configured
4. **TypeScript errors**: Run `npm run type-check` for detailed errors

---

## 📄 License

This project is proprietary software developed for Solarium Green Energy. All rights reserved.

## 🏷️ Version

Current Version: 2.1.0
Last Updated: January 2024

## Architecture Overview

### Technology Stack
- **Frontend**: React 18.2, TypeScript 5.2, Material-UI 5.14
- **State Management**: Redux Toolkit 1.9.7 with RTK Query
- **Routing**: React Router v6
- **Build Tool**: Vite 4.5
- **Testing**: Vitest + React Testing Library + jest-axe
- **Styling**: Material-UI + CSS-in-JS (Emotion)

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── dashboard/      # Dashboard-specific components
│   ├── ui/             # Generic UI components
│   ├── loading/        # Loading states and skeletons
│   └── error/          # Error handling components
├── pages/              # Route-level page components
├── layout/             # Application layout components
├── store/              # Redux store and slices
├── api/                # RTK Query API endpoints
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── contexts/           # React context providers
```

## Dashboard Module

### Overview
The Dashboard module provides the main landing page for authenticated Admin and KAM users, displaying key business metrics, recent activities, and quick navigation actions.

### Components

#### Dashboard Page (`src/pages/Dashboard.tsx`)
The main dashboard component that orchestrates data fetching and UI rendering.

**Features:**
- Role-based metric display (Admin vs KAM)
- Real-time data loading with skeleton states
- Responsive grid layout (3/2/1 columns on lg/md/sm)
- Quick action navigation
- Error handling with retry functionality
- Accessibility compliance (WCAG 2.1 AA)

**Props:** None (uses Auth context for user data)

**API Integration:** Uses `useDashboardMetricsByRole` hook

#### PlaceholderCard (`src/components/dashboard/PlaceholderCard.tsx`)
Reusable placeholder widget for dashboard sections not yet implemented.

**Props:**
```typescript
interface PlaceholderCardProps {
  title: string;
  subtitle?: string;
  minHeight?: number; // Default: 200px
}
```

#### QuickActionTile (`src/components/dashboard/QuickActionTile.tsx`)
Individual action button for dashboard navigation.

**Props:**
```typescript
interface QuickActionTileProps {
  label: string;
  icon: React.ReactElement;
  onClick: () => void;
}
```

### API Contracts

#### Dashboard Metrics Endpoint

**GET `/api/v1/dashboard/metrics`**

Query Parameters:
```typescript
interface DashboardMetricsParams {
  dateRange?: {
    from?: string; // ISO date string
    to?: string;   // ISO date string
  };
  includeDetails?: boolean; // Default: true
  limit?: number;           // Default: 10
}
```

Response:
```typescript
interface DashboardMetrics {
  // Basic metrics (all roles)
  activeLeads: number;
  pendingQuotations: number;
  recentLeads: Array<{
    id: string;
    customerName: string;
    status: string;
    createdAt: string;
  }>;

  // Admin-only metrics
  channelPartners?: number;
  pendingCommissions?: number;
  totalRevenue?: number;

  // Activity data
  recentActivities: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'lead' | 'quotation' | 'commission' | 'system';
  }>;

  // Metadata
  dateRange: {
    from: string;
    to: string;
  };
  lastUpdated: string;
  refreshInterval?: number;
}
```

**POST `/api/v1/dashboard/metrics/refresh`**

Triggers manual refresh of dashboard metrics.

Response: Same as GET endpoint with updated timestamps.

### Custom Hooks

#### useDashboardMetrics
Main hook for dashboard metrics data management.

```typescript
const {
  data,
  isLoading,
  isError,
  error,
  hasData,
  lastUpdated,
  metricsAge,
  refetch,
  refresh
} = useDashboardMetrics(options);
```

Options:
```typescript
interface UseDashboardMetricsOptions {
  params?: DashboardMetricsParams;
  pollingInterval?: number;
  skip?: boolean;
  refetchOnMount?: boolean;
  refetchOnFocus?: boolean;
}
```

#### useDashboardMetricsByRole
Convenience hook that automatically adjusts parameters based on user role.

```typescript
const metrics = useDashboardMetricsByRole(userRole);
```

- **Admin**: `includeDetails: true, limit: 20`
- **KAM**: `includeDetails: true, limit: 10`
- **Other**: `includeDetails: false, limit: 5`

### Caching Strategy

The dashboard uses RTK Query with the following caching approach:
- **Tag Type**: `Analytics` (shared with other analytics endpoints)
- **Cache Duration**: 60 seconds (baseApi default)
- **Invalidation**: Manual refresh mutation invalidates `Analytics` tag
- **Polling**: Optional with customizable intervals

### Error Handling

Dashboard implements comprehensive error handling:
1. **Network Errors**: Shows retry button with graceful fallback
2. **API Errors**: Displays user-friendly error messages
3. **Empty Data**: Shows appropriate empty states
4. **Loading States**: Skeleton loading with minimum 1.5s visibility

### Accessibility Features

- **WCAG 2.1 AA Compliance**: Verified with jest-axe
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and landmarks
- **Color Contrast**: Meets accessibility standards
- **Focus Management**: Logical tab order and focus indicators

## Navigation & Layout

### Sidebar Navigation
Role-based navigation with secure filtering and state persistence.

**Features:**
- Role-based menu items (Admin: 8 items, KAM: 5 items)
- Collapse state persistence via localStorage
- Responsive behavior (desktop/mobile)
- Accessibility compliance
- Security (forbidden items removed from DOM)

### Protected Routes
Comprehensive route protection with security logging.

**Features:**
- Authentication requirement
- Role-based access control
- Territory-based filtering (future)
- Custom permission checks
- Security audit logging
- Proper redirect flows

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Security plugin enabled
- **Prettier**: Consistent formatting
- **Testing**: ≥80% coverage required
- **Accessibility**: jest-axe validation

### Testing Strategy
- **Unit Tests**: Component logic and hooks
- **Integration Tests**: API and component interaction
- **Accessibility Tests**: WCAG compliance
- **E2E Tests**: User workflows (future)

### Performance Considerations
- **Code Splitting**: Lazy loading for non-critical routes
- **Memoization**: Expensive calculations and renders
- **API Caching**: RTK Query with intelligent invalidation
- **Bundle Optimization**: Tree shaking and dead code elimination

## Deployment

### Environment Configuration
```bash
# Required Environment Variables
VITE_API_BASE_URL=https://api.solarium.com
VITE_ENVIRONMENT=production
VITE_SESSION_TIMEOUT_MIN=30
VITE_CRYPTO_SECRET=<32-character-secret>
```

### Build Process
```bash
# Development
npm run dev

# Production Build
npm run build
npm run preview

# Testing
npm run test
npm run test:coverage
npm run test:a11y
```

### Quality Gates
- **Test Coverage**: ≥80% overall, ≥70% per file
- **Accessibility**: 0 violations on critical components
- **Security**: ESLint security rules passing
- **Performance**: Lighthouse score ≥90

## API Integration

### Base Configuration
All API endpoints extend the base RTK Query configuration:
- **Base URL**: Configurable via environment
- **Authentication**: JWT token in Authorization header
- **Error Handling**: Centralized error mapping
- **Retry Logic**: Exponential backoff
- **Token Refresh**: Automatic with mutex protection

### Endpoint Patterns
```typescript
// Standard query endpoint
builder.query<ResponseType, ParamsType>({
  query: (params) => ({
    url: '/endpoint',
    method: 'GET',
    params,
  }),
  providesTags: ['TagName'],
  transformResponse: (response) => transformData(response),
  transformErrorResponse: (error) => mapError(error),
});
```

## Security

### Authentication & Authorization
- **JWT Tokens**: Short-lived access tokens with refresh capability
- **Role-Based Access**: Admin, KAM, CP, Customer roles
- **Route Protection**: Comprehensive access control
- **Session Management**: Automatic timeout and refresh

### Data Security
- **Encrypted Storage**: AES-256 for sensitive data
- **HTTPS Only**: All communication encrypted
- **Input Validation**: Client and server-side validation
- **XSS Protection**: CSP headers and sanitization

## Monitoring & Observability

### Logging
- **Security Events**: Access attempts and denials
- **Performance Metrics**: API response times
- **Error Tracking**: Client-side error reporting
- **User Analytics**: Usage patterns and flows

### Health Checks
- **API Health**: Endpoint availability monitoring
- **Client Health**: Error rate and performance monitoring
- **Dependency Health**: Third-party service status

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Business intelligence widgets
- **Real-time Updates**: WebSocket integration
- **Offline Support**: Progressive Web App features
- **Enhanced Security**: Multi-factor authentication
- **Performance**: Server-side rendering

### Technical Debt
- **Bundle Size**: Optimize third-party dependencies
- **Test Coverage**: Increase E2E test coverage
- **Documentation**: API documentation automation
- **Performance**: Implement virtual scrolling for large lists

## Contributing

### Development Setup
1. **Prerequisites**: Node.js 18 LTS, npm 9+
2. **Installation**: `npm install`
3. **Configuration**: Copy `.env.example` to `.env.local`
4. **Development**: `npm run dev`
5. **Testing**: `npm run test`

### Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Test coverage ≥80%
- [ ] Accessibility validation passed
- [ ] Security ESLint rules passed
- [ ] Performance impact assessed
- [ ] Documentation updated

### Git Workflow
- **Feature Branches**: `feat/TASK-ID-description`
- **Commit Messages**: `TASK-ID: Brief description`
- **Pull Requests**: Required for all changes
- **Code Review**: Minimum one approval required

---

For detailed API documentation, see the individual endpoint files in `src/api/endpoints/`.
For component usage examples, see the test files in `src/**/__tests__/`. 