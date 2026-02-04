# Debugging Free Signup Issues

## Quick Debugging Steps

### 1. Test Sentry Integration
Visit: `https://getjobping.com/api/debug/sentry-test`

This will:
- Verify Sentry DSN is configured
- Send test messages/exceptions to Sentry
- Show Sentry configuration status

### 2. Check Signup Logs
Visit: `https://getjobping.com/api/debug/signup-logs`

Query params:
- `?errors=true` - Show only errors
- `?limit=100` - Limit number of logs

### 3. Browser Console Debugging

After a failed signup attempt, check:
```javascript
// Last signup error
window.__lastSignupError

// All signup debug logs (if available)
window.__signupDebugLogs
```

### 4. Vercel Logs

Check Vercel dashboard → Your Project → Logs

Filter for:
- `[FREE SIGNUP]`
- `[SIGNUP DEBUG]`
- `[asyncHandler]`
- `🚨` (emoji indicates errors)

### 5. Common Issues

#### Sentry Not Working
- Check `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` in Vercel environment variables
- Verify Sentry project is active
- Check Sentry dashboard for rate limits

#### Silent Failures
- Check `/api/debug/signup-logs?errors=true` for recent errors
- Check browser console for `window.__lastSignupError`
- Check Vercel function logs

#### Network Errors
- Check browser Network tab for failed requests
- Look for CORS errors
- Check if API route is deployed correctly

## Debug Endpoints

### `/api/debug/sentry-test`
Tests Sentry integration

### `/api/debug/signup-test`
Tests signup API with sample data

### `/api/debug/signup-logs`
Returns recent signup logs (server-side)

## Enhanced Logging

All signup events are now logged with:
- Timestamp
- Stage/step
- Request ID
- Full error details (if error)

Logs are stored in memory (last 100 entries) and also sent to:
- Console (always)
- Sentry (if configured)
- Vercel logs (always)

## Next Steps

If signup still fails:
1. Check `/api/debug/signup-logs?errors=true`
2. Check browser console for `window.__lastSignupError`
3. Check Vercel logs
4. Test Sentry with `/api/debug/sentry-test`
5. Review error details in Sentry dashboard
