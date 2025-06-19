# Territory-Based Data Filtering

## Overview

The Solarium Web Portal implements comprehensive territory-based data filtering to ensure users only see data they are authorized to access. This document outlines the territory filtering implementation across the application.

## Territory Model

### User Roles and Territory Access

- **Admin**: Full access to all territories
- **KAM (Key Account Manager)**: Access limited to assigned territories
- **CP (Channel Partner)**: Access limited to assigned territories  
- **Customer**: No territory restrictions

### Territory Types

```typescript
type Territory = 
  | 'North' | 'South' | 'East' | 'West' | 'Central'
  | 'Northeast' | 'Northwest' | 'Southeast' | 'Southwest';
```

## Implementation

### 1. User Model Extension

Users now include a `territories` array:

```typescript
interface User {
  // ... other fields
  territories: Territory[]; // Array of assigned territories
}
```

### 2. Automatic Query Parameter Injection

RTK Query automatically injects territory parameters for KAM users:

```typescript
// For KAM user with territories ['North', 'East']:
GET /api/v1/leads?search=solar&territories=North,East

// For Admin user:
GET /api/v1/leads?search=solar
// (no territory filtering)
```

### 3. API Headers

Territory access information is sent via headers:

```http
# Admin users
X-Territory-Access: all

# KAM users  
X-Territory-Access: filtered
X-User-Territories: North,East
```

### 4. Client-Side Filtering

UI components use hooks to filter data:

```typescript
import { useTerritoryFilter } from '../hooks/useTerritoryFilter';

const MyComponent = () => {
  const allLeads = useGetLeadsQuery();
  const filteredLeads = useTerritoryFilter(allLeads.data);
  
  // filteredLeads only contains leads the user can access
};
```

## API Usage Examples

### Query Parameters

KAM users automatically get territory filtering:

```javascript
// This call:
api.getLeads({ search: 'solar', status: 'active' })

// Automatically becomes:
// GET /leads?search=solar&status=active&territories=North,East
```

### Territory Validation

Server-side validation ensures data integrity:

```javascript
// Validate before data modification
const validation = validateTerritoryAccess(user, 'North', 'write');
if (!validation.allowed) {
  throw new Error(validation.reason);
}
```

## Data Reduction Impact

Territory filtering significantly reduces data exposure:

- **Admin users**: See 100% of system data
- **KAM users**: See ~22% of system data (2/9 territories)
- **Reduction rate**: >80% for typical KAM users

## Testing

### Unit Tests

Territory utilities are comprehensively tested:

```bash
npm run test territory
```

Key test scenarios:
- Admin vs KAM data access
- Query parameter injection
- Client-side filtering
- Negative access validation

### Integration Tests

API integration validates:
- Automatic parameter injection
- Header setting
- Territory-based responses

## Security Considerations

1. **Server-side enforcement**: Territory filtering must be enforced on the backend
2. **Client-side filtering**: Provides UX optimization but not security
3. **Data validation**: All data modifications validate territory access
4. **Audit logging**: Territory access violations should be logged

## Development Guidelines

### Adding New Territory-Filtered Endpoints

1. Server endpoint should respect `territories` query parameter
2. Client endpoint automatically gets territory injection (no code changes needed)
3. Add tests for both admin and KAM user scenarios

### UI Components

Use territory hooks for consistent filtering:

```typescript
// ✅ Correct
const filteredData = useTerritoryFilter(rawData);

// ❌ Incorrect - manual filtering
const filteredData = rawData.filter(item => 
  user.territories.includes(item.territory)
);
```

### Testing New Features

Always test with both user types:

```typescript
describe('New Feature', () => {
  it('should allow admin full access', () => {
    // Test with mockAdminUser
  });
  
  it('should filter data for KAM users', () => {
    // Test with mockKamUser
  });
  
  it('should prevent out-of-scope access', () => {
    // Negative test with restricted data
  });
});
```

## Troubleshooting

### Common Issues

1. **KAM seeing no data**: Check territory assignments in user profile
2. **Query parameters not injected**: Verify RTK Query setup and user authentication
3. **Client-side filtering not working**: Ensure `useTerritoryFilter` hook is used correctly

### Debug Tools

Development environment provides territory debugging:

```javascript
// Browser console
window.__TERRITORY_DEBUG__ = true;

// This will log all territory filtering operations
```

## Performance Considerations

- Territory filtering reduces data transfer by >80% for KAM users
- Client-side filtering is memoized for performance
- API calls include territory headers to enable server-side optimizations 