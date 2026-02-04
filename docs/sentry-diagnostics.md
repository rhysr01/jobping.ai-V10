# Sentry Diagnostics Guide

## Quick Check

### 1. Check Sentry Status
Visit: `https://getjobping.com/api/debug/sentry-status`

This shows:
- If Sentry DSN is configured
- Environment settings
- Test message sent status

### 2. Test Sentry Capture
Visit: `https://getjobping.com/api/debug/sentry-test`

This sends test events to Sentry and confirms they're being sent.

### 3. Check Vercel Logs
Look for these log patterns in Vercel:
- `[Sentry Server] Event captured:` - Event was captured
- `[Sentry Server] Event sent successfully:` - Event was sent to Sentry
- `[Sentry Server] ❌ DSN not found` - Sentry not configured

## Common Issues

### Events Not Appearing in Sentry Dashboard

1. **Check Environment Filter**
   - Sentry dashboard → Issues → Filter by environment
   - Make sure you're looking at the right environment (production/preview/development)

2. **Check Date Range**
   - Events might be filtered by date
   - Check "Last 24 hours" or "Last 7 days"

3. **Check Inbound Filters**
   - Sentry → Settings → Projects → [Your Project] → Inbound Data Filters
   - Test events might be filtered out
   - Check if "Filter out known web crawlers" is blocking requests

4. **Verify DSN**
   - Check `.env.local` has `SENTRY_DSN` set
   - Check Vercel environment variables match
   - DSN format: `https://[key]@[org].ingest.sentry.io/[project-id]`

5. **Check Network**
   - Sentry events are sent asynchronously
   - Check Vercel logs for `[Sentry Server] Event sent successfully`
   - If you see "Event send response is null", events aren't reaching Sentry

## Debugging Steps

### Step 1: Verify Configuration
```bash
# Check if DSN is set
echo $SENTRY_DSN

# Or check .env.local
grep SENTRY_DSN .env.local
```

### Step 2: Test Locally
```bash
# Run Sentry test script
npm run test:sentry

# Or use the test endpoint locally
curl http://localhost:3000/api/debug/sentry-test
```

### Step 3: Check Vercel Logs
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by: `[Sentry Server]` or `[Sentry Client]`
3. Look for:
   - `Event captured:` - Event was created
   - `Event sent successfully:` - Event reached Sentry
   - `Event send response is null` - Event failed to send

### Step 4: Check Sentry Dashboard
1. Go to Sentry Dashboard
2. Check:
   - **Issues** tab for errors
   - **Performance** tab for transactions
   - **Releases** tab for release tracking
   - **Settings → Projects → [Your Project] → Client Keys** to verify DSN

## Enhanced Logging

All Sentry events now log:
- Event ID (for tracking)
- Status code (200 = success)
- Original exception details
- Environment and tags

Look for these in Vercel logs to verify events are being sent.

## Test Endpoints

- `/api/debug/sentry-status` - Check Sentry configuration
- `/api/debug/sentry-test` - Send test events to Sentry
- `/api/debug/signup-logs` - View signup logs (includes Sentry errors)

## If Events Still Don't Appear

1. **Check Sentry Project Settings**
   - Verify DSN matches your project
   - Check if project is active
   - Verify organization has access

2. **Check Rate Limits**
   - Sentry has rate limits
   - Check if you've exceeded quota
   - Look for rate limit errors in logs

3. **Check CORS/Network**
   - Sentry uses `ingest.sentry.io`
   - Check if Vercel can reach Sentry
   - Look for network errors in logs

4. **Enable Debug Mode**
   - Set `SENTRY_DEBUG=true` in Vercel
   - This enables verbose logging
   - Check logs for detailed event information
