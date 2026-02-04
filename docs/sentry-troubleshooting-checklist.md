# Sentry Troubleshooting Checklist

## ✅ Quick Checks

### 1. Configuration Check
Visit: `https://your-domain.com/api/debug/sentry-status`

**Expected Response:**
```json
{
  "enabled": true,
  "dsn": "https://f55f891a4b912e9...",
  "environment": "production",
  "testMessageSent": true
}
```

**If `enabled: false`:**
- Check Vercel environment variables
- Verify `SENTRY_DSN` is set
- Check DSN format is correct

### 2. Test Event
Visit: `https://your-domain.com/api/debug/sentry-test`

**Expected Response:**
```json
{
  "success": true,
  "testId": "test-1234567890",
  "message": "Sentry test events sent. Check Sentry dashboard."
}
```

**Then check Sentry dashboard for:**
- Message: "Sentry test message test-1234567890"
- Exception: "Sentry test error test-1234567890"

### 3. Check Vercel Logs
Go to: Vercel Dashboard → Your Project → Logs

**Look for:**
```
[Sentry Server] ✅ Initialized for environment: production
[Sentry Server] Event captured: { message: "...", eventId: "..." }
[Sentry Server] Event sent successfully: { eventId: "...", statusCode: 200 }
```

**If you see:**
- `❌ DSN not found` → Sentry not configured
- `Event send response is null` → Events not reaching Sentry
- No `Event sent successfully` → Network/configuration issue

## 🔍 Why Events Might Not Appear

### Issue 1: Environment Filter
**Symptom:** Events sent but not visible in dashboard

**Fix:**
1. Sentry Dashboard → Issues
2. Filter dropdown → Select correct environment
3. Check: `production`, `preview`, `development`

### Issue 2: Date Range Filter
**Symptom:** Recent events not showing

**Fix:**
1. Sentry Dashboard → Issues
2. Date range → Select "Last 24 hours" or "Last 7 days"
3. Or check "All time"

### Issue 3: Inbound Filters
**Symptom:** Test events filtered out

**Fix:**
1. Sentry → Settings → Projects → [Your Project]
2. Inbound Data Filters
3. Check if test events are being filtered
4. Temporarily disable filters to test

### Issue 4: Wrong Project/DSN
**Symptom:** Events going to wrong project

**Fix:**
1. Check DSN in Vercel environment variables
2. Verify DSN matches Sentry project
3. Format: `https://[key]@[org].ingest.sentry.io/[project-id]`

### Issue 5: Rate Limits
**Symptom:** Some events missing

**Fix:**
1. Sentry Dashboard → Settings → Usage
2. Check if quota exceeded
3. Upgrade plan if needed

## 📊 Verify Events Are Being Sent

### Check Vercel Logs
Search for: `[Sentry Server] Event sent successfully`

**Good:**
```
[Sentry Server] Event sent successfully: { eventId: "abc123", statusCode: 200 }
```

**Bad:**
```
[Sentry Server] Event send response is null - event may not have been sent
```

### Check Network
Events are sent to: `https://[org].ingest.sentry.io/api/[project-id]/envelope/`

If you see network errors in logs, check:
- Vercel can reach Sentry
- No firewall blocking
- DSN is correct

## 🎯 Next Steps

1. **Deploy changes** (already pushed)
2. **Visit `/api/debug/sentry-status`** to verify config
3. **Visit `/api/debug/sentry-test`** to send test events
4. **Check Vercel logs** for `[Sentry Server] Event sent successfully`
5. **Check Sentry dashboard** with correct environment filter

## 📝 Debug Mode

Enable verbose logging:
```bash
# In Vercel environment variables
SENTRY_DEBUG=true
```

This will show:
- Every event being captured
- Event IDs
- Send status
- Original exceptions

## 🔗 Useful Links

- Sentry Dashboard: https://sentry.io/organizations/[your-org]/issues/
- Vercel Logs: https://vercel.com/[your-project]/logs
- Test Endpoint: `/api/debug/sentry-test`
- Status Endpoint: `/api/debug/sentry-status`
