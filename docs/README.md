# Solarium Web Portal - Technical Documentation

## Overview

The Solarium Web Portal is a comprehensive Lead Management Platform for solar product sales, built with React 18, TypeScript, and Material-UI. This documentation covers the complete technical architecture, API contracts, and development guidelines.

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