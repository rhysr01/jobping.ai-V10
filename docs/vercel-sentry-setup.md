# Setting Up Sentry in Vercel

## ⚠️ CRITICAL: Sentry DSN Not Configured

Your Sentry test shows: `"sentryDsn":"MISSING"` - This means Sentry is **NOT configured in Vercel**.

## How to Fix

### Step 1: Get Your Sentry DSN

Your DSN from `.env.local`:
```
https://f55f891a4b912e9308edd59b1f7464c0@o4510279772995584.ingest.de.sentry.io/4510279774044240
```

### Step 2: Add to Vercel Environment Variables

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

2. Add these variables:

   **For Production:**
   - Name: `SENTRY_DSN`
   - Value: `https://f55f891a4b912e9308edd59b1f7464c0@o4510279772995584.ingest.de.sentry.io/4510279774044240`
   - Environment: `Production`

   **For Preview:**
   - Name: `SENTRY_DSN`
   - Value: `https://f55f891a4b912e9308edd59b1f7464c0@o4510279772995584.ingest.de.sentry.io/4510279774044240`
   - Environment: `Preview`

   **For Development (optional):**
   - Name: `SENTRY_DSN`
   - Value: `https://f55f891a4b912e9308edd59b1f7464c0@o4510279772995584.ingest.de.sentry.io/4510279774044240`
   - Environment: `Development`

3. **Redeploy** your project (or wait for next deployment)

### Step 3: Verify Configuration

After redeploying, visit:
- `https://getjobping.com/api/debug/sentry-status`

**Expected Response:**
```json
{
  "enabled": true,
  "dsn": "https://f55f891a4b912e9...",
  "environment": "production",
  "testMessageSent": true
}
```

### Step 4: Test Sentry

Visit: `https://getjobping.com/api/debug/sentry-test`

Then check your Sentry dashboard for the test events.

## Why This Matters

Without the DSN set in Vercel:
- ❌ No errors are sent to Sentry
- ❌ No error tracking
- ❌ No performance monitoring
- ✅ Errors still logged to Vercel logs (but not Sentry)

## Quick Checklist

- [ ] DSN added to Vercel environment variables
- [ ] Set for Production environment
- [ ] Set for Preview environment (optional)
- [ ] Project redeployed
- [ ] `/api/debug/sentry-status` shows `enabled: true`
- [ ] `/api/debug/sentry-test` sends events successfully
- [ ] Events appear in Sentry dashboard

## Alternative: Use Vercel Sentry Integration

If you prefer, you can use Vercel's built-in Sentry integration:

1. Go to: **Vercel Dashboard → Your Project → Integrations**
2. Search for "Sentry"
3. Connect your Sentry account
4. This automatically sets the DSN

This is often easier than manually setting environment variables.
