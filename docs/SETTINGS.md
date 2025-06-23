# Settings Management Documentation

## Overview

The Settings Management module provides a comprehensive system configuration interface for Solarium Web Portal administrators. This module allows real-time configuration of application parameters, feature flags, and system thresholds without requiring application restarts.

## Features

### 🎯 Core Capabilities
- **Global Settings Management**: Configure system-wide parameters
- **Feature Flag Control**: Toggle application features in real-time
- **Numeric Thresholds**: Set limits and boundaries for various operations
- **Audit Trail**: Complete history of all configuration changes
- **Real-time Updates**: Immediate propagation of changes across the application

### 🔐 Security Features
- **Admin-only Access**: Restricted to users with admin role
- **Input Validation**: Server-side validation for all parameter updates
- **Audit Logging**: Comprehensive change tracking with user attribution
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **CSP Compliance**: Content Security Policy compliant implementation

## Architecture

### Frontend Components

```
src/
├── components/settings/
│   ├── SettingsPage.tsx          # Main settings container
│   ├── GeneralSettingsForm.tsx   # Basic configuration form
│   ├── FeatureFlagsForm.tsx      # Feature flag toggles
│   ├── ThresholdSettingsForm.tsx # Numeric threshold settings
│   ├── AuditLogTable.tsx         # Change history display
│   └── schemas.ts                # Validation schemas
├── hooks/
│   ├── useAuditLogs.ts          # Audit log management hook
│   └── useSettingsForm.ts       # Form state management
├── api/endpoints/
│   └── settingsEndpoints.ts     # RTK Query endpoints
└── types/
    └── settings.types.ts        # TypeScript definitions
```

### State Management

The Settings module uses a hybrid approach:
- **RTK Query**: For API communication and caching
- **Local Slice**: Non-persisted Redux slice for runtime state
- **React Context**: Feature flag propagation to components

```typescript
// Settings are not persisted in Redux to ensure server authority
const settingsSlice = createSlice({
  name: 'settings',
  initialState: defaultSettings,
  reducers: {
    syncSettingsFromApi: (state, action) => action.payload,
    setFeatureFlagPending: (state, { payload }) => {
      state.featureFlags[payload.flag] = payload.value;
    },
  },
});
```

## API Endpoints

### GET /api/v1/settings
Retrieves current system settings.

**Response:**
```json
{
  "sessionTimeoutMin": 30,
  "tokenExpiryMin": 60,
  "featureFlags": {
    "ADVANCED_REPORTING": true,
    "ANALYTICS": false,
    "DEBUG_MODE": false
  },
  "thresholds": {
    "MAX_LEADS_PER_PAGE": 50,
    "SESSION_WARNING_MIN": 5
  },
  "enableNotifications": true,
  "enableAnalytics": true,
  "enableDebugMode": false,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "updatedBy": "admin@solarium.com"
}
```

### PATCH /api/v1/settings
Updates system settings (Admin only).

**Request:**
```json
{
  "sessionTimeoutMin": 45,
  "featureFlags": {
    "ADVANCED_REPORTING": false
  }
}
```

**Response:** Updated settings object

### GET /api/v1/settings/audit
Retrieves audit log with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `field`: Filter by field name
- `userId`: Filter by user ID
- `dateFrom`: Start date filter
- `dateTo`: End date filter

**Response:**
```json
{
  "logs": [
    {
      "id": "1",
      "userId": "admin-123",
      "userName": "Admin User",
      "field": "sessionTimeoutMin",
      "oldValue": 30,
      "newValue": 45,
      "timestamp": "2024-01-15T10:30:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

## Configuration Categories

### 1. General Settings
- **Session Timeout**: User session duration (5-1440 minutes)
- **Token Expiry**: JWT token validity period (15-4320 minutes)
- **Notifications**: Global notification settings

### 2. Feature Flags
Runtime toggles for application features:
- `ADVANCED_REPORTING`: Enable advanced analytics
- `ANALYTICS`: Enable usage tracking
- `DEBUG_MODE`: Enable debug information (restricted)
- `BULK_OPERATIONS`: Enable bulk data operations

### 3. Thresholds
Numeric limits for various operations:
- `MAX_LEADS_PER_PAGE`: Pagination limit for leads
- `SESSION_WARNING_MIN`: Minutes before session warning
- `MAX_FILE_SIZE_MB`: Maximum file upload size

### 4. Security Settings
- Authentication timeouts
- Rate limiting parameters
- Security feature toggles

## Usage Examples

### Basic Settings Update
```typescript
import { useUpdateSettingsMutation } from '../api/endpoints/settingsEndpoints';

const [updateSettings, { isLoading }] = useUpdateSettingsMutation();

const handleSave = async () => {
  try {
    await updateSettings({
      sessionTimeoutMin: 45,
      enableNotifications: true,
    }).unwrap();
    toast.success('Settings saved successfully');
  } catch (error) {
    toast.error('Failed to save settings');
  }
};
```

### Feature Flag Toggle
```typescript
import { useUpdateFeatureFlagMutation } from '../api/endpoints/settingsEndpoints';

const [updateFeatureFlag] = useUpdateFeatureFlagMutation();

const handleToggleFlag = async (flag: string, value: boolean) => {
  try {
    await updateFeatureFlag({ flag, value }).unwrap();
  } catch (error) {
    // Optimistic update will be rolled back automatically
    console.error('Failed to update feature flag:', error);
  }
};
```

### Audit Log Display
```typescript
import { useAuditLogs } from '../hooks/useAuditLogs';

const AuditLogComponent = () => {
  const {
    logs,
    total,
    page,
    setPage,
    isLoading,
  } = useAuditLogs({
    initialPageSize: 10,
  });

  return (
    <AuditLogTable
      logs={logs}
      total={total}
      page={page}
      onPageChange={setPage}
      isLoading={isLoading}
    />
  );
};
```

## Validation Rules

### Numeric Validation
```typescript
const settingsSchema = yup.object({
  sessionTimeoutMin: yup
    .number()
    .min(5, 'Minimum 5 minutes')
    .max(1440, 'Maximum 24 hours')
    .required(),
  tokenExpiryMin: yup
    .number()
    .min(15, 'Minimum 15 minutes')
    .max(4320, 'Maximum 3 days')
    .required(),
});
```

### Feature Flag Validation
- Boolean values only
- Predefined flag names
- Admin-only restricted flags

## Security Considerations

### Access Control
- Settings endpoints require admin authentication
- JWT token validation on every request
- Role-based access control (RBAC)

### Input Validation
- Server-side validation for all inputs
- Numeric range validation
- XSS prevention in audit log display
- CSRF protection

### Audit Trail
- Complete change history
- User attribution for all changes
- IP address and user agent logging
- Timestamp precision to milliseconds

## Performance Optimizations

### Caching Strategy
- RTK Query automatic caching
- 60-second cache retention
- Optimistic updates for immediate UI response
- Tag-based cache invalidation

### Lazy Loading
- Settings page loaded as separate chunk
- React.lazy for code splitting
- Virtualized tables for large audit logs

### Real-time Updates
- Feature flags propagated via React Context
- No page refresh required for changes
- Automatic rollback on API failures

## Testing Strategy

### Unit Tests
- Component rendering and interactions
- Hook functionality and state management
- API endpoint mocking with MSW
- Form validation logic

### Integration Tests
- Complete user workflows
- API communication patterns
- Error handling scenarios
- Access control enforcement

### E2E Tests
- Admin login → settings navigation → flag toggle → audit verification
- Cross-component feature flag propagation
- Error recovery and rollback scenarios

## Troubleshooting

### Common Issues

1. **Settings not saving**
   - Check admin role assignment
   - Verify JWT token validity
   - Check network connectivity

2. **Feature flags not updating**
   - Verify optimistic update logic
   - Check for API errors in console
   - Ensure proper React Context integration

3. **Audit log not showing changes**
   - Check audit endpoint permissions
   - Verify pagination parameters
   - Check date filters

### Debug Tools

```typescript
// Access API utilities in development
if (process.env.NODE_ENV === 'development') {
  window.__SETTINGS_DEBUG__ = {
    getCurrentSettings: () => store.getState().settings,
    clearCache: () => store.dispatch(apiSlice.util.resetApiState()),
    getAuditLogs: () => auditLogsQuery.data,
  };
}
```

## Migration and Deployment

### Environment Variables
```bash
# Required for settings functionality
VITE_SETTINGS_CACHE_TTL=60
VITE_AUDIT_LOG_RETENTION_DAYS=90
VITE_FEATURE_FLAG_POLLING_INTERVAL=30000
```

### Database Considerations
- Settings stored in dedicated table
- Audit logs with proper indexing
- Backup strategy for configuration data

### Rollback Procedures
- Feature flag immediate rollback capability
- Settings version history
- Emergency disable procedures

## Future Enhancements

### Planned Features
- Bulk settings import/export
- Settings templates and presets
- Advanced audit log filtering
- Real-time collaboration indicators
- Settings approval workflow

### Performance Improvements
- Settings caching at CDN level
- Batch update operations
- WebSocket for real-time updates
- Progressive loading for large configurations

---

For technical support or feature requests, contact the development team or create an issue in the project repository. 