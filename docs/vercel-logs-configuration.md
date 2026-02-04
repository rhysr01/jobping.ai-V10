# Vercel Logs Configuration

## Current Setup ✅

### Automatic Log Capture
Vercel **automatically captures** all console output:
- `console.log()` → Appears in Vercel Logs
- `console.error()` → Appears in Vercel Logs (highlighted)
- `console.warn()` → Appears in Vercel Logs

### Logging Stack

1. **Direct Console Logs** (`console.log/error`)
   - Used in `/app/api/signup/free/route.ts`
   - Format: `[FREE SIGNUP] 🚀 Request received`
   - ✅ Captured by Vercel automatically

2. **Structured Logger** (`lib/monitoring/logger.ts`)
   - Uses `apiLogger` wrapper
   - Outputs to `console.log` → ✅ Captured by Vercel
   - Format: `[timestamp] LEVEL: message {context}`

3. **Debug Logger** (`lib/debug-signup.ts`)
   - New debugging utility
   - Outputs to `console.log` → ✅ Captured by Vercel
   - Stores in-memory logs (last 100 entries)

### Vercel Configuration (`vercel.json`)

```json
{
  "env": {
    "NODE_OPTIONS": "--no-deprecation"
  }
}
```

**Note**: No explicit logging configuration needed - Vercel captures all console output automatically.

## How to View Logs

### 1. Vercel Dashboard
- Go to: Vercel Dashboard → Your Project → Logs
- Filter by:
  - `[FREE SIGNUP]` - Signup flow logs
  - `[SIGNUP DEBUG]` - Debug logs
  - `[asyncHandler]` - Route handler logs
  - `🚨` - Error emoji (search for this)

### 2. Vercel CLI
```bash
vercel logs [deployment-url]
```

### 3. Debug Endpoints
- `/api/debug/signup-logs?errors=true` - Server-side logs
- `/api/debug/sentry-test` - Test Sentry integration

### 4. Browser Console
- `window.__lastSignupError` - Last signup error (client-side)

## Log Levels

Current log levels (from `lib/monitoring/config.ts`):
- **Development**: `debug` (shows all logs)
- **Production**: `info` (shows info, warn, error, critical)

Set via `LOG_LEVEL` environment variable:
- `error` - Only errors
- `warn` - Warnings and errors
- `info` - Info, warnings, errors (default production)
- `debug` - All logs (default development)

## Log Format

### Console Logs (Direct)
```
[FREE SIGNUP] 🚀 Request received { requestId, timestamp, url }
```

### Structured Logger
```
[2026-02-04T12:00:00.000Z] INFO: Free signup request received {"component":"api","requestId":"..."}
```

### Debug Logger
```
📝 [SIGNUP DEBUG] REQUEST_RECEIVED { timestamp, stage, data }
```

## Troubleshooting

### Logs Not Appearing in Vercel?

1. **Check Environment Variables**
   - `LOG_LEVEL` should be set appropriately
   - `NODE_ENV` should be `production` for production logs

2. **Verify Console Output**
   - All logs use `console.log/error` → ✅ Should appear
   - Check `lib/monitoring/config.ts` → `logging.console` should be `true`

3. **Check Vercel Dashboard**
   - Go to: Project → Logs
   - Filter by function: `app/api/signup/free/route.ts`
   - Look for recent deployments

4. **Test with Debug Endpoint**
   - Visit: `/api/debug/sentry-test`
   - Check Vercel logs for `[SENTRY TEST]` entries

### Missing Logs?

If logs aren't appearing:
1. Check `MONITORING_CONFIG.logging.console` is `true`
2. Verify logs are using `console.log/error` (not custom logger)
3. Check Vercel function timeout (set to 90s for signup route)
4. Verify deployment is active

## Best Practices

1. **Use Emojis for Visibility** ✅
   - `🚀` - Start of operation
   - `✅` - Success
   - `❌` - Error
   - `🚨` - Critical error

2. **Include Request IDs** ✅
   - All logs include `requestId` for tracing

3. **Structured Context** ✅
   - Logs include full context objects
   - Easy to filter/search in Vercel

4. **Error Logging** ✅
   - Errors logged with full stack traces
   - Sentry integration for error tracking
   - Debug logger for fallback

## Current Status

✅ **Logging is properly configured**
- All logs go to `console.log/error`
- Vercel automatically captures them
- Multiple logging layers (console, structured, debug)
- Error tracking via Sentry + debug logger

**No changes needed** - Vercel automatically captures all console output!
