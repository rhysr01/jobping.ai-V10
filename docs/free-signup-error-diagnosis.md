# Free Signup Error Diagnosis

**Date**: January 21, 2026  
**Status**: 🔧 Fixed

## Issues Found & Fixed

### 1. ❌ **Missing RPC Function `exec_sql`**

**Problem**: Code was calling `supabase.rpc('exec_sql', ...)` but this function doesn't exist in the database.

**Location**: 
- `app/api/signup/free/route.ts` line 429 (user existence check)
- `app/api/signup/free/route.ts` line 492 (promo_pending cleanup)

**Impact**: 
- Silent failures when checking for existing users
- Errors not properly logged or tracked
- Fallback code existed but errors weren't visible

**Fix Applied**:
- ✅ Removed non-existent `exec_sql` RPC calls
- ✅ Replaced with direct Supabase queries
- ✅ Added comprehensive error logging with Sentry tracking
- ✅ Added proper error context for debugging

**Code Changes**:
```typescript
// BEFORE (broken):
const { data, error } = await supabase.rpc('exec_sql', {
  sql: `SELECT id, subscription_tier FROM users WHERE email = $1 LIMIT 1`,
  params: [normalizedEmail]
});

// AFTER (fixed):
const { data, error } = await supabase
  .from("users")
  .select("id, subscription_tier")
  .eq("email", normalizedEmail)
  .maybeSingle();

if (error) {
  // Proper error logging and Sentry tracking
  apiLogger.warn("Error checking existing user", error, {...});
  Sentry.captureException(error, {...});
}
```

### 2. ⚠️ **Insufficient Error Logging**

**Problem**: RPC failures were caught but not logged, making debugging impossible.

**Fix Applied**:
- ✅ Added `apiLogger.warn()` for all error cases
- ✅ Added Sentry tracking with proper tags and context
- ✅ Added error codes and messages to logs
- ✅ Added request ID for tracing

### 3. 🔍 **Error Handling Improvements**

**Changes Made**:
1. **User Existence Check**:
   - Now logs errors with full context
   - Tracks errors in Sentry with `user_check` tag
   - Continues gracefully if check fails (doesn't block signup)

2. **Promo Pending Cleanup**:
   - Now logs warnings (not errors) since it's non-critical
   - Doesn't fail signup if cleanup fails
   - Proper error context in logs

## Error Tracking

All errors are now tracked in Sentry with:
- ✅ Request ID for tracing
- ✅ Error type tags (`user_check`, `user_check_unexpected`, etc.)
- ✅ Full context (email, error codes, etc.)
- ✅ Proper log levels (warn for non-critical, error for critical)

## Testing Recommendations

1. **Test User Existence Check**:
   - Try signing up with existing email → Should handle gracefully
   - Check logs for proper error tracking
   - Verify Sentry events are created

2. **Test Database Errors**:
   - Simulate database connection issues
   - Verify errors are logged and tracked
   - Verify signup doesn't crash

3. **Test Promo Cleanup**:
   - Sign up with email that has promo_pending entry
   - Verify cleanup happens (or logs warning if it fails)
   - Verify signup succeeds even if cleanup fails

## Related Files

- `app/api/signup/free/route.ts` - Main signup route (fixed)
- `lib/api-logger.ts` - Logging utility
- `lib/errors.ts` - Error handling utilities

## Next Steps

1. ✅ Monitor Sentry for new errors
2. ✅ Check logs for any remaining silent failures
3. ✅ Verify signup flow works end-to-end
4. ✅ Consider adding integration tests for error scenarios

## Conclusion

✅ **All RPC-related errors fixed**  
✅ **Comprehensive error logging added**  
✅ **Sentry tracking improved**  
✅ **Error handling made more robust**

The free signup should now work reliably with proper error tracking and logging.
