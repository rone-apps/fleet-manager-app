# Token Expiration Fix - Implementation Checklist

## Pre-Deployment Checklist

### 1. Review Changes ✅
- [ ] Review `/app/lib/api.js` modifications
- [ ] Review new `/app/lib/useAuth.js` hook
- [ ] Review `/app/middleware.js` enhancements
- [ ] Review `/app/signin/page.js` updates
- [ ] Read `TOKEN_EXPIRATION_FIX_SUMMARY.md`
- [ ] Read `TOKEN_HANDLING_CHEATSHEET.md`

### 2. Test in Development 🧪
- [ ] Clear all browser storage (localStorage, cookies)
- [ ] Login with valid credentials
- [ ] Verify token is set in both localStorage and cookie
- [ ] Navigate between pages - should work normally
- [ ] Manually expire token in localStorage (edit exp timestamp)
- [ ] Refresh page - should redirect to `/signin`
- [ ] Login again - should work
- [ ] Make an API call with expired token - should redirect
- [ ] Test logout - should clear storage and redirect

### 3. Update Existing Pages (Progressive) 📝

**Priority 1 - Critical Pages** (Do these first)
- [ ] `/app/drivers/page.js` - Add useAuth hook, replace fetch
- [ ] `/app/cabs/page.js` - Add useAuth hook, replace fetch
- [ ] `/app/users/page.js` - Add useAuth hook, replace fetch
- [ ] `/app/shifts/page.js` - Add useAuth hook, replace fetch

**Priority 2 - Important Pages**
- [ ] `/app/expenses/page.js` - Add useAuth hook, replace fetch
- [ ] `/app/financial-setup/page.js` - Add useAuth hook, replace fetch
- [ ] `/app/account-management/page.js` - Add useAuth hook, replace fetch
- [ ] `/app/reports/page.js` - Add useAuth hook, replace fetch
- [ ] `/app/data-uploads/page.js` - Add useAuth hook, replace fetch

**Priority 3 - Other Pages**
- [ ] `/app/taxicaller-integration/page.js` - Add useAuth hook, replace fetch
- [ ] Any other custom pages

**For Each Page:**
1. Add import: `import { useAuth } from '../lib/useAuth';`
2. Add hook call: `useAuth();` at top of component
3. Replace all `fetch(${API_BASE_URL}...` with `apiRequest(...`
4. Update error handling to ignore auth errors (they auto-redirect)
5. Test the page thoroughly

### 4. Backend Verification ⚙️
- [ ] Verify backend returns 401 for expired tokens
- [ ] Verify token expiration time is reasonable (e.g., 24 hours)
- [ ] Check backend logs for auth errors
- [ ] Ensure CORS allows cookie setting

## Deployment Steps

### Step 1: Backup Current Code
```bash
git add .
git commit -m "Backup before token expiration fix"
git branch backup-pre-token-fix
```

### Step 2: Deploy Core Changes
1. Deploy updated `/app/lib/api.js`
2. Deploy new `/app/lib/useAuth.js`
3. Deploy updated `/app/middleware.js`
4. Deploy updated `/app/signin/page.js`

### Step 3: Test Core Functionality
- [ ] Login works
- [ ] Token is set correctly
- [ ] Middleware protects routes
- [ ] Expired token redirects

### Step 4: Deploy Page Updates (Progressive)
1. Start with Priority 1 pages
2. Deploy and test each page
3. Move to Priority 2 pages
4. Move to Priority 3 pages

### Step 5: Monitor and Validate
- [ ] Check browser console for errors
- [ ] Monitor user feedback
- [ ] Check server logs for 401 errors
- [ ] Verify no infinite redirects

## Post-Deployment Validation

### Functional Tests ✅
- [ ] Login → Success → Token set
- [ ] Navigate pages → Success
- [ ] Logout → Success → Storage cleared
- [ ] Expired token → Redirect to login
- [ ] 401 from server → Redirect to login
- [ ] Invalid token → Redirect to login
- [ ] No token → Redirect to login

### Browser Testing 🌐
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Edge (Desktop)
- [ ] Chrome Mobile (iOS)
- [ ] Safari Mobile (iOS)
- [ ] Chrome Mobile (Android)

### Edge Cases 🔍
- [ ] Multiple tabs - token expires in one
- [ ] Page reload with expired token
- [ ] Direct URL access to protected route
- [ ] Network error vs auth error
- [ ] Token expires mid-request
- [ ] Back button after logout

### Performance Check ⚡
- [ ] No noticeable slowdown
- [ ] Token checks are fast (< 1ms)
- [ ] No excessive API calls
- [ ] Memory usage normal

## Rollback Plan (If Needed)

If issues arise:

```bash
# Rollback to backup
git checkout backup-pre-token-fix

# Or restore individual files
git checkout backup-pre-token-fix app/lib/api.js
git checkout backup-pre-token-fix app/middleware.js
```

## Documentation Checklist 📚

- [ ] Team has read `TOKEN_EXPIRATION_FIX_SUMMARY.md`
- [ ] Developers have `TOKEN_HANDLING_CHEATSHEET.md` handy
- [ ] Example page (`EXAMPLE_PAGE_WITH_TOKEN_HANDLING.js`) reviewed
- [ ] Token expiration guide (`TOKEN_EXPIRATION_GUIDE.md`) available

## Communication Plan 📢

### Before Deployment
- [ ] Notify team of upcoming changes
- [ ] Share documentation links
- [ ] Schedule deployment window
- [ ] Prepare rollback plan

### During Deployment
- [ ] Monitor error logs
- [ ] Be available for issues
- [ ] Test each deployed component

### After Deployment
- [ ] Announce completion
- [ ] Share test results
- [ ] Collect feedback
- [ ] Document any issues

## Success Criteria ✨

The implementation is successful when:

✅ Users are automatically redirected to login when token expires
✅ No silent failures or confusing error messages
✅ All pages consistently handle token expiration
✅ No performance degradation
✅ No increase in error rate
✅ Positive user feedback on experience
✅ Development team comfortable with new pattern

## Support Resources

- **Documentation**: See `TOKEN_EXPIRATION_GUIDE.md`
- **Quick Reference**: See `TOKEN_HANDLING_CHEATSHEET.md`
- **Example Code**: See `EXAMPLE_PAGE_WITH_TOKEN_HANDLING.js`
- **Summary**: See `TOKEN_EXPIRATION_FIX_SUMMARY.md`

## Notes

- This is a **non-breaking change** - existing code continues to work
- Updates can be done **progressively** - page by page
- **No database changes** required
- **No API changes** required
- Fully **backward compatible**

## Timeline Estimate

- Core deployment: **30 minutes**
- Priority 1 pages: **2-3 hours**
- Priority 2 pages: **3-4 hours**
- Priority 3 pages: **1-2 hours**
- Testing: **2-3 hours**
- **Total: 1-2 days** (depending on number of pages)

Progressive rollout is recommended - start with core changes and 2-3 pages, test thoroughly, then proceed with remaining pages.
