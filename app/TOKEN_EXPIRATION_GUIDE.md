# Token Expiration Handling Implementation Guide

## Overview

This implementation provides comprehensive token expiration handling for FareFlow, ensuring users are automatically redirected to the login page when their session expires instead of experiencing silent failures.

## Key Features

1. **Automatic Token Validation** - Tokens are checked before every API request
2. **Periodic Expiration Checks** - Client-side polling to detect expiration proactively
3. **Middleware Protection** - Server-side route protection with token validation
4. **Graceful Redirects** - Uses `window.location.replace()` to prevent back-button issues
5. **Cookie + LocalStorage** - Dual storage for better security and middleware support

## Components

### 1. Enhanced API Helper (`/app/lib/api.js`)

**Key Functions:**

- `validateToken()` - Checks if token exists and is not expired before requests
- `handleAuthError()` - Centralized auth error handling with cleanup
- `apiRequest()` - Enhanced fetch wrapper with automatic token validation and 401 handling
- `isTokenExpired()` - Decodes JWT and checks expiration timestamp
- `logout()` - Clears all auth data and redirects to login

**Usage:**
```javascript
import { apiRequest } from '../lib/api';

// All requests automatically validate token and handle expiration
const response = await apiRequest('/drivers', {
  method: 'GET'
});
```

### 2. Authentication Hook (`/app/lib/useAuth.js`)

**Two Hooks Provided:**

#### `useAuth(options)`
Provides continuous token monitoring with periodic checks.

```javascript
import { useAuth } from '../lib/useAuth';

export default function MyPage() {
  // Check token every 60 seconds (default)
  useAuth();
  
  // Or customize the interval
  useAuth({ checkInterval: 30000 }); // Check every 30 seconds
  
  // Or disable auth requirement (for public pages)
  useAuth({ requireAuth: false });
  
  return <div>Protected content</div>;
}
```

#### `useAuthCheck()`
Simple one-time check on component mount.

```javascript
import { useAuthCheck } from '../lib/useAuth';

export default function SimplePage() {
  // Just check once on mount
  useAuthCheck();
  
  return <div>Protected content</div>;
}
```

### 3. Enhanced Middleware (`/app/middleware.js`)

**Features:**
- Validates token on every route navigation
- Checks token expiration server-side
- Clears expired token cookies
- Redirects to `/signin` for unauthenticated/expired requests
- Prevents authenticated users from accessing `/signin`

**Automatic Protection:**
All routes except `/signin` are automatically protected. No additional configuration needed.

### 4. Updated Sign-In Page (`/app/signin/page.js`)

**Changes:**
- Sets token in both `localStorage` and `cookie`
- Uses `window.location.replace()` instead of `router.push()`
- Cookie set with 24-hour expiration and SameSite=Strict

## Migration Guide for Existing Pages

### Before (Manual Fetch with Silent Failures):

```javascript
export default function DriversPage() {
  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      } else {
        setError("Failed to load drivers");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  return <div>...</div>;
}
```

### After (With Automatic Token Handling):

```javascript
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/useAuth';

export default function DriversPage() {
  // Add automatic token monitoring
  useAuth();

  const loadDrivers = async () => {
    try {
      // apiRequest automatically validates token and handles 401
      const response = await apiRequest('/drivers', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      } else {
        setError("Failed to load drivers");
      }
    } catch (error) {
      // Auth errors automatically redirect to login
      // Other errors can be handled here
      if (error.message !== 'Authentication required' && 
          error.message !== 'Session expired. Please login again.') {
        console.error(error);
        setError(error.message);
      }
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  return <div>...</div>;
}
```

## How It Works

### Flow Diagram

```
User Action → Component Mounts
    ↓
useAuth Hook Runs
    ↓
Check Token Exists & Not Expired
    ↓
├─ Valid → Continue
│   ↓
│   User Performs Action
│   ↓
│   API Request (via apiRequest)
│   ↓
│   Pre-Request Token Validation
│   ↓
│   ├─ Valid → Send Request
│   │   ↓
│   │   Server Responds
│   │   ↓
│   │   ├─ 200 OK → Return Data
│   │   └─ 401 → Clear Auth → Redirect to /signin
│   │
│   └─ Expired → Clear Auth → Redirect to /signin
│
└─ Invalid/Expired → Clear Auth → Redirect to /signin
```

### Token Validation Happens At:

1. **Component Mount** - via `useAuth()` or `useAuthCheck()`
2. **Periodic Intervals** - every 60 seconds (configurable)
3. **Before API Requests** - via `validateToken()` in `apiRequest()`
4. **Server Response** - 401 errors trigger immediate logout
5. **Route Navigation** - middleware validates on each page load

## Testing

### Test Scenario 1: Expired Token on Page Load
1. Get a valid token
2. Manually expire it (set `exp` timestamp in past)
3. Refresh page
4. **Expected:** Immediate redirect to `/signin`

### Test Scenario 2: Token Expires During Session
1. Login with valid token
2. Wait for token to expire naturally
3. Try to perform an action (load data, submit form)
4. **Expected:** Redirect to `/signin` with cleared storage

### Test Scenario 3: Server Returns 401
1. Login successfully
2. Backend invalidates token
3. Make API request
4. **Expected:** Redirect to `/signin` immediately

### Test Scenario 4: Network Error
1. Login successfully
2. Disconnect network
3. Make API request
4. **Expected:** Error message shown, NO redirect (network errors don't mean expired token)

## Configuration Options

### Change Token Check Interval

```javascript
// Check every 30 seconds instead of default 60
useAuth({ checkInterval: 30000 });
```

### Disable Periodic Checks

```javascript
// Just check on mount
useAuthCheck();
```

### Add Additional Public Routes

In `/app/middleware.js`:
```javascript
const publicPaths = ['/signin', '/forgot-password', '/about'];
```

### Customize Cookie Expiration

In `/app/signin/page.js`:
```javascript
// Set cookie to expire in 8 hours instead of 24
document.cookie = `token=${data.token}; path=/; max-age=28800; SameSite=Strict`;
```

## Best Practices

1. **Always use `apiRequest()`** - Don't use raw `fetch()` for authenticated requests
2. **Add `useAuth()` to protected pages** - Ensures continuous monitoring
3. **Handle errors gracefully** - Don't assume all errors are auth errors
4. **Test token expiration** - Regularly test with short-lived tokens
5. **Monitor console logs** - Warnings indicate token issues

## Common Pitfalls to Avoid

❌ **Don't do this:**
```javascript
// Bypassing the helper
fetch(`${API_BASE_URL}/drivers`, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});
```

✅ **Do this instead:**
```javascript
// Using the helper
apiRequest('/drivers', { method: 'GET' });
```

❌ **Don't do this:**
```javascript
// Ignoring the auth hook
export default function MyPage() {
  const [data, setData] = useState([]);
  // Missing useAuth()!
  return <div>{data}</div>;
}
```

✅ **Do this instead:**
```javascript
// Adding auth monitoring
export default function MyPage() {
  useAuth(); // Add this!
  const [data, setData] = useState([]);
  return <div>{data}</div>;
}
```

## Troubleshooting

### Issue: User not redirected on expiration
**Solution:** Check that `useAuth()` is called in the component

### Issue: Infinite redirect loop
**Solution:** Make sure `/signin` is in `publicPaths` in middleware.js

### Issue: Token validation fails but token is valid
**Solution:** Check server clock sync - JWT expiration depends on accurate timestamps

### Issue: User logged out immediately after login
**Solution:** Verify token expiration time from backend is in the future

## Future Enhancements

- Token refresh mechanism (get new token before expiration)
- Remember me functionality with longer-lived tokens
- Session activity tracking
- Logout on multiple failed requests
- Visual warning before expiration ("Your session will expire in 5 minutes")
