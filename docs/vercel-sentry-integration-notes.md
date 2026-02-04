# Vercel Sentry Integration Notes

## How Vercel Sentry Integration Works

When you use Vercel's Sentry integration (not manual env vars):

1. **DSN is injected at build time** - Not always available at runtime
2. **Source maps are uploaded automatically** - Via `SENTRY_AUTH_TOKEN`
3. **Deployments are tracked** - Sentry knows about each Vercel deployment

## Checking Integration Status

### If DSN shows "NOT SET" but integration is enabled:

1. **Check Vercel Integration:**
   - Vercel Dashboard → Your Project → Integrations
   - Verify Sentry integration is connected
   - Check if it's enabled for Production/Preview

2. **Check Sentry Dashboard:**
   - Sentry → Settings → Integrations → Vercel
   - Verify your Vercel project is connected
   - Check if integration is active

3. **Check Build Logs:**
   - Vercel Dashboard → Your Project → Deployments → [Latest] → Build Logs
   - Look for: `Sentry uploading source maps`
   - Look for: `Sentry DSN configured`

## Why DSN Might Not Show at Runtime

Vercel Sentry integration may:
- Inject DSN only during build (for source map uploads)
- Not expose DSN as environment variable at runtime
- Use internal mechanisms to send events

## Verify Sentry is Working

Even if DSN shows "NOT SET", Sentry might still work:

1. **Check if Sentry is initialized:**
   - Visit: `https://getjobping.com/api/debug/sentry-status`
   - Look for: `"sentryInitialized": true`

2. **Send test event:**
   - Visit: `https://getjobping.com/api/debug/sentry-test`
   - Check Sentry dashboard for the test event

3. **Check Vercel logs:**
   - Look for: `[Sentry Server] ✅ Initialized`
   - Look for: `[Sentry Server] Event captured:`

## If Events Still Don't Appear

1. **Verify Integration Connection:**
   - Vercel → Integrations → Sentry → Check connection status
   - Reconnect if needed

2. **Check Sentry Project Settings:**
   - Sentry → Settings → Projects → [Your Project]
   - Verify DSN matches your project
   - Check if project is active

3. **Check Environment Filters:**
   - Sentry Dashboard → Filter by environment
   - Make sure you're viewing the correct environment

4. **Enable Debug Mode:**
   - Add to Vercel: `SENTRY_DEBUG=true`
   - This shows detailed Sentry logs in Vercel logs

## Manual Override (If Needed)

If integration isn't working, you can manually set:
- `SENTRY_DSN` in Vercel environment variables
- This will override integration settings
