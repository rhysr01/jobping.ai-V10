# Sentry Events Not Recording - Diagnostic Guide

## Problem

Sentry API is working (configuration is correct), but events are not appearing in the Sentry dashboard.

## Common Causes

### 1. **Serverless Function Termination**

In Vercel's serverless environment, functions can terminate before Sentry finishes sending events.

**Solution:** Always call `await Sentry.flush(timeout)` before returning responses in API routes.

### 2. **Sentry Not Enabled at Runtime**

Even if DSN is set at build time (via Vercel integration), Sentry might be disabled if DSN is not available at runtime.

**Check:** Visit `/api/debug/sentry-status` and verify:
- `sentryEnabled: true`
- `enabled: true`

### 3. **Flush Timeout Too Short**

Default flush timeout (2000ms) might be too short for slow network conditions.

**Solution:** Increase flush timeout to 5000ms or more:
```typescript
await Sentry.flush(5000); // 5 seconds
```

### 4. **Events Being Filtered**

`beforeSend` hook might be returning `null`, which filters out events.

**Check:** Look for `[Sentry Server] Event captured` logs in Vercel logs. If you see these logs but events don't appear in Sentry, the `beforeSend` hook might be filtering them.

## Diagnostic Endpoints

### 1. Check Sentry Status
```
GET /api/debug/sentry-status
```

Returns:
- `enabled`: Is Sentry enabled?
- `sentryEnabled`: Is Sentry actually initialized and enabled?
- `dsn`: DSN status
- `testMessageSent`: Did test message send successfully?

### 2. Test Sentry Flush
```
GET /api/debug/sentry-flush-test
```

Comprehensive test that:
- Checks if Sentry is enabled
- Captures a test message
- Captures a test exception
- Flushes with extended timeout (5 seconds)
- Returns detailed results

### 3. Simple Sentry Test
```
GET /api/debug/sentry-test
```

Basic test that sends a message and exception, then flushes.

## How to Diagnose

### Step 1: Check Status
```bash
curl https://getjobping.com/api/debug/sentry-status
```

Look for:
- `sentryEnabled: true` ✅
- `testMessageSent: true` ✅

### Step 2: Run Flush Test
```bash
curl https://getjobping.com/api/debug/sentry-flush-test
```

Check the response:
- `flush.success: true` ✅
- `flush.duration`: Should be < 5000ms
- `messageCapture.success: true` ✅
- `exceptionCapture.success: true` ✅

### Step 3: Check Vercel Logs

Look for these log patterns:
- `[Sentry Server] ✅ Initialized` - Sentry is initialized
- `[Sentry Server] ✅ Event captured (beforeSend)` - Event was captured
- `[Sentry Server] Event captured:` - Event details

If you see "Event captured" but events don't appear in Sentry:
- Check if `beforeSend` is returning `null`
- Check if flush is completing (`flush.success: true`)
- Check network connectivity

### Step 4: Check Sentry Dashboard

1. Go to Sentry Dashboard
2. Filter by environment: `production`
3. Look for events with tag `test: true` or `testId: flush-test-*`
4. Check if events are being filtered (Sentry → Settings → Filters)

## Solutions

### Solution 1: Ensure Flush is Called

In all API routes that capture Sentry events:

```typescript
try {
  Sentry.captureException(error);
  await Sentry.flush(5000); // Wait up to 5 seconds
} catch (flushError) {
  console.error("Sentry flush failed:", flushError);
}
```

### Solution 2: Increase Flush Timeout

For critical errors, use longer timeout:

```typescript
await Sentry.flush(10000); // 10 seconds
```

### Solution 3: Verify DSN in Vercel

Even with Vercel integration, manually set `SENTRY_DSN` in Vercel environment variables to ensure it's available at runtime.

### Solution 4: Check beforeSend Hook

Ensure `beforeSend` always returns the event (not `null`):

```typescript
beforeSend(event, hint) {
  // Log for debugging
  console.log("[Sentry] Event captured:", event.event_id);
  
  // CRITICAL: Always return event (don't filter it out)
  return event; // ✅ Good
  // return null; // ❌ Bad - filters out event
}
```

## Configuration Updates

Recent changes to improve event recording:

1. **Increased shutdown timeout** in `sentry.server.config.ts`:
   ```typescript
   shutdownTimeout: 10000, // 10 seconds
   ```

2. **Enhanced logging** in `beforeSend` hook to track events

3. **New flush test endpoint** (`/api/debug/sentry-flush-test`) for comprehensive testing

## Still Not Working?

1. **Check Sentry Project Settings:**
   - Is the project active?
   - Are there any filters blocking events?
   - Is the DSN correct?

2. **Check Vercel Environment Variables:**
   - `SENTRY_DSN` is set
   - `SENTRY_AUTH_TOKEN` is set (for source maps)
   - Variables are set for Production environment

3. **Enable Debug Mode:**
   - Add `SENTRY_DEBUG=true` to Vercel env vars
   - This shows detailed Sentry logs in Vercel logs

4. **Check Network:**
   - Vercel serverless functions can have network issues
   - Check Vercel status page
   - Try again after a few minutes

## Expected Behavior

When working correctly:

1. ✅ `/api/debug/sentry-status` shows `sentryEnabled: true`
2. ✅ `/api/debug/sentry-flush-test` shows `flush.success: true`
3. ✅ Vercel logs show `[Sentry Server] ✅ Event captured`
4. ✅ Events appear in Sentry dashboard within 1-2 minutes
5. ✅ Events have correct environment tag (`production`)
