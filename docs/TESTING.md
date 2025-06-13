# Testing Guide

This document provides comprehensive testing instructions for the Solarium Web Portal.

## Automated Testing

### Test Suites

#### Unit Tests
```bash
npm run test:unit
```
Tests individual components and functions in isolation.

#### Integration Tests
```bash
npm run test:integration
```
Tests component interactions and user flows.

#### Accessibility Tests
```bash
npm run test:accessibility
```
Tests components for accessibility compliance using jest-axe.

#### Performance Tests
```bash
npm run test:performance
```
Tests rendering performance and memory usage.

### Coverage Requirements

- **Minimum Coverage**: 50% overall
- **Component Coverage**: 60%
- **Context Coverage**: 55%

Run coverage report:
```bash
npm run test:coverage
```

### Continuous Integration

Run the complete test suite:
```bash
npm run qa:full
```

This includes:
- Type checking
- Linting
- All test suites
- Build verification
- Bundle size checks

## Manual Testing Checklist

### 🔐 Authentication Flow

#### Login Process
- [ ] Navigate to application (should redirect to login)
- [ ] Enter valid admin credentials (admin@solarium.com / any password)
- [ ] Verify successful login and redirect to dashboard
- [ ] Verify admin role badge displays
- [ ] Test logout functionality

#### Role-Based Access
- [ ] Login as KAM user (kam@solarium.com / any password)
- [ ] Verify KAM role badge displays
- [ ] Verify admin-only features are hidden
- [ ] Test access to admin-only routes (should show 403)

### 🖥️ Responsive Design

#### Desktop (1920x1080)
- [ ] Verify full sidebar is visible
- [ ] Check all navigation items are accessible
- [ ] Verify dashboard grid layout (3-4 columns)
- [ ] Test sidebar collapse functionality

#### Tablet (1024x768)
- [ ] Verify responsive layout adapts correctly
- [ ] Test sidebar toggle behavior
- [ ] Check dashboard grid responsiveness (2-3 columns)
- [ ] Verify touch interactions work

#### Mobile (375x667)
- [ ] Verify mobile drawer navigation
- [ ] Test hamburger menu functionality
- [ ] Check single-column layout
- [ ] Verify touch targets are appropriate size
- [ ] Test swipe gestures (if implemented)

### 🔄 Navigation & Routing

#### Basic Navigation
- [ ] Test all sidebar navigation links
- [ ] Verify active state highlighting
- [ ] Test browser back/forward buttons
- [ ] Verify page titles update correctly

#### Error Pages
- [ ] Navigate to non-existent URL (should show 404)
- [ ] Test 404 page "Go Back" button
- [ ] Test 404 page "Go Home/Dashboard" button
- [ ] Access admin route as KAM (should show 403)
- [ ] Test 403 page navigation options

### ⚡ Performance

#### Loading States
- [ ] Verify loading indicators during authentication
- [ ] Test skeleton loaders on dashboard
- [ ] Check loading states during navigation
- [ ] Verify no stuck loading states

#### Bundle Size
- [ ] Run `npm run build:analyze`
- [ ] Verify initial bundle < 1MB
- [ ] Check for unnecessary code splitting
- [ ] Verify lazy loading works correctly

### 🧪 Error Handling

#### Error Boundaries
- [ ] Trigger component error (if test button exists)
- [ ] Verify error boundary catches error
- [ ] Test "Try Again" functionality
- [ ] Verify error logging (check console)

#### Network Errors
- [ ] Simulate network failure during login
- [ ] Verify appropriate error messages
- [ ] Test retry mechanisms
- [ ] Check offline behavior (if implemented)

### ⏱️ Session Management

#### Session Timeout
- [ ] Wait for session warning (appears 5 min before expiry)
- [ ] Test "Stay Logged In" button
- [ ] Test "Logout Now" button
- [ ] Verify automatic logout after timeout
- [ ] Test session extension on activity

#### Session Persistence
- [ ] Login and refresh page
- [ ] Verify user remains logged in
- [ ] Close and reopen browser
- [ ] Verify session persistence behavior

### 🎨 UI/UX Components

#### Buttons
- [ ] Test all button variants (primary, secondary, outline)
- [ ] Verify loading states on buttons
- [ ] Test button hover effects
- [ ] Check button accessibility (keyboard navigation)

#### Modals
- [ ] Test modal opening/closing
- [ ] Verify backdrop click closes modal
- [ ] Test escape key to close
- [ ] Check modal responsiveness

#### Forms
- [ ] Test all form field types
- [ ] Verify validation messages
- [ ] Test password visibility toggle
- [ ] Check form submission states

### 🌍 Environment Configuration

#### Development Environment
- [ ] Verify environment banner displays
- [ ] Check "Development" label and version
- [ ] Test banner expansion for build info
- [ ] Verify banner dismissal functionality

#### Staging Environment
- [ ] Build with staging config: `npm run build:staging`
- [ ] Verify staging API URL configuration
- [ ] Check environment-specific features
- [ ] Test staging session timeout settings

#### Production Environment
- [ ] Build with production config: `npm run build:prod`
- [ ] Verify no environment banner
- [ ] Check production optimizations
- [ ] Verify no debug tools available

### ♿ Accessibility

#### Keyboard Navigation
- [ ] Navigate entire app using only keyboard
- [ ] Verify focus indicators are visible
- [ ] Test tab order is logical
- [ ] Check skip links (if implemented)

#### Screen Reader Support
- [ ] Test with screen reader (if available)
- [ ] Verify ARIA labels are present
- [ ] Check heading hierarchy
- [ ] Test form field labels

#### Color & Contrast
- [ ] Verify color contrast meets WCAG guidelines
- [ ] Test in high contrast mode
- [ ] Check color-only information usage
- [ ] Test with color blindness simulator

### 🔧 Browser Compatibility

#### Chrome
- [ ] Test all major functionality
- [ ] Verify developer tools work
- [ ] Check performance metrics
- [ ] Test extensions compatibility

#### Firefox
- [ ] Test core functionality
- [ ] Verify responsive design
- [ ] Check security features
- [ ] Test developer tools

#### Safari
- [ ] Test on macOS Safari
- [ ] Verify iOS Safari (if mobile support)
- [ ] Check webkit-specific features
- [ ] Test privacy features

#### Edge
- [ ] Test on Windows Edge
- [ ] Verify Chromium compatibility
- [ ] Check Microsoft integrations
- [ ] Test accessibility features

## Test Data

### User Accounts
- **Admin**: admin@solarium.com / any password
- **KAM**: kam@solarium.com / any password

### Test Scenarios
- **New User**: First-time login flow
- **Returning User**: Established session
- **Different Roles**: Admin vs KAM capabilities
- **Session Expiry**: Timeout scenarios

## Reporting Issues

When reporting bugs, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser and version
4. Screen size / device
5. Console errors (if any)
6. Screenshots (if helpful)

## Performance Benchmarks

Target performance metrics:
- **Initial page load**: < 3 seconds
- **Route navigation**: < 500ms
- **Component render**: < 100ms
- **Bundle size**: < 1MB initial
- **Lighthouse score**: > 90

Use browser dev tools to measure:
```bash
# Run lighthouse audit
npx lighthouse http://localhost:3000 --chrome-flags="--headless"
``` 