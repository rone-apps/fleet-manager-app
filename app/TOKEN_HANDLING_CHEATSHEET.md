# Token Expiration Handling - Quick Reference

## 🚀 Quick Start

### 1. Add to Every Protected Page Component

```javascript
import { useAuth } from '../lib/useAuth';

export default function MyPage() {
  useAuth(); // Add this line!
  // ... rest of your component
}
```

### 2. Replace All fetch() Calls

```javascript
// ❌ OLD WAY
const response = await fetch(`${API_BASE_URL}/drivers`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});

// ✅ NEW WAY
import { apiRequest } from '../lib/api';

const response = await apiRequest('/drivers', {
  method: 'GET'
});
```

## 📝 Common Operations

### GET Request
```javascript
const response = await apiRequest('/endpoint');
// or
const response = await apiRequest('/endpoint', { method: 'GET' });
```

### POST Request
```javascript
const response = await apiRequest('/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### PUT Request
```javascript
const response = await apiRequest(`/endpoint/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
```

### DELETE Request
```javascript
const response = await apiRequest(`/endpoint/${id}`, {
  method: 'DELETE'
});
```

### With Custom Headers
```javascript
const response = await apiRequest('/endpoint', {
  method: 'POST',
  headers: {
    'X-Custom-Header': 'value'
  },
  body: JSON.stringify(data)
});
```

## 🛡️ Error Handling Pattern

```javascript
try {
  const response = await apiRequest('/endpoint');
  
  if (response.ok) {
    const data = await response.json();
    // Handle success
  } else {
    const error = await response.json().catch(() => ({}));
    setError(error.message || 'Operation failed');
  }
} catch (error) {
  // Auth errors auto-redirect - just return/ignore
  if (error.message === 'Authentication required' || 
      error.message === 'Session expired. Please login again.') {
    return; // Already being redirected
  }
  
  // Handle other errors
  console.error(error);
  setError(error.message);
}
```

## ⚙️ Hook Options

### Default (Check every 60 seconds)
```javascript
useAuth();
```

### Custom Interval
```javascript
useAuth({ checkInterval: 30000 }); // Check every 30 seconds
```

### One-Time Check Only
```javascript
import { useAuthCheck } from '../lib/useAuth';

useAuthCheck(); // Only checks on mount
```

### Public Page (No Auth Required)
```javascript
useAuth({ requireAuth: false });
```

## 🔧 Utility Functions

### Check Authentication
```javascript
import { isAuthenticated } from '../lib/api';

if (isAuthenticated()) {
  // User is logged in
}
```

### Get Current User
```javascript
import { getCurrentUser } from '../lib/api';

const user = getCurrentUser();
console.log(user.username, user.role);
```

### Manual Logout
```javascript
import { logout } from '../lib/api';

logout(); // Clears storage and redirects to /signin
```

### Check Token Expiration
```javascript
import { isTokenExpired } from '../lib/api';

const token = localStorage.getItem('token');
if (isTokenExpired(token)) {
  // Token is expired
}
```

## 🎯 What Happens on Token Expiration?

1. **Automatic Detection** - useAuth hook or apiRequest detects expired token
2. **Clear All Data** - localStorage, sessionStorage, and cookies cleared
3. **Redirect to Login** - User sent to `/signin` page
4. **No Back Button** - Uses `replace()` to prevent returning to protected pages

## ⚠️ Important Notes

- ✅ Always use `apiRequest()` for API calls
- ✅ Add `useAuth()` to all protected components
- ✅ Don't manually handle 401 errors - they auto-redirect
- ✅ Test with expired tokens regularly
- ❌ Don't use raw `fetch()` with manual auth headers
- ❌ Don't manually redirect on auth errors (handled automatically)
- ❌ Don't check `isAuthenticated()` in components (use useAuth hook)

## 📱 Files to Know

| File | Purpose |
|------|---------|
| `/app/lib/api.js` | Core API helper with token validation |
| `/app/lib/useAuth.js` | React hooks for auth monitoring |
| `/app/middleware.js` | Server-side route protection |
| `/app/signin/page.js` | Login page with token setup |

## 🧪 Testing Checklist

- [ ] Login works and sets token
- [ ] Token checked on page load
- [ ] Expired token redirects to login
- [ ] API calls validate token before sending
- [ ] 401 from server triggers redirect
- [ ] Logout clears all storage
- [ ] Back button doesn't return to protected pages
- [ ] Multiple tabs handle expiration correctly

## 💡 Pro Tips

1. **Check console for warnings** - Token issues logged with `console.warn()`
2. **Use browser dev tools** - Check Application → Local Storage and Cookies
3. **Test with short-lived tokens** - Temporarily modify backend to issue 5-minute tokens
4. **Monitor network tab** - Watch for 401 responses during development
