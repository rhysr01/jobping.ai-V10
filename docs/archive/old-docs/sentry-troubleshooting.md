# Sentry Troubleshooting Guide

## Issue: "No issues match your search" in Sentry Dashboard

If you're seeing "No issues match your search" in Sentry, follow these steps to diagnose and fix the issue.

## Quick Diagnostic Steps

### 1. Verify Sentry Configuration

Run the diagnostic script:

```bash
npm run test:sentry
```

This will:
- Check if `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is set
- Validate DSN format
- Send test events to Sentry
- Show debug information

### 1a. Verify Sentry MCP Configuration (for MCP tools)

If you're using Sentry MCP tools and getting 404 errors:

```bash
npm run test:sentry-mcp
```

This will:
- Check if `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are set
- Test API connection to Sentry
- Verify organization and project access
- List available projects and recent issues

### 2. Check Environment Variables

Ensure these are set in your environment (Vercel dashboard or `.env.local`):

```bash
# Required for error tracking
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
# OR
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Optional but recommended for source maps
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token

# Required for Sentry MCP tools (if using MCP integration)
# Get these from:
# - Auth Token: https://sentry.io/settings/tokens/
# - Org/Project: Check your Sentry project URL
```

### 3. Enable Debug Mode

Temporarily enable debug mode to see what Sentry is doing:

```bash
# In your environment variables
SENTRY_DEBUG=true
```

This will log all Sentry events to the console, helping you see if events are being captured.

### 4. Check Environment Filter

**Common Issue**: Sentry filters events by environment. Make sure your dashboard filter matches your deployment environment.

- **Production**: `VERCEL_ENV=production` or `NODE_ENV=production`
- **Preview**: `VERCEL_ENV=preview`
- **Development**: `VERCEL_ENV=development` or `NODE_ENV=development`

**Fix**: In Sentry dashboard, check the environment filter dropdown. Make sure it's set to "All Environments" or matches your current environment.

### 5. Check Date Range Filter

**Common Issue**: Date range is too narrow or set to future dates.

**Fix**: In Sentry dashboard:
1. Click the date range picker
2. Select "Last 24 hours" or "Last 7 days"
3. Ensure the end date is today (not in the future)

### 6. Check Inbound Data Filters

**Common Issue**: Sentry has inbound data filters that may exclude test events.

**Fix**: In Sentry dashboard:
1. Go to **Settings** → **Projects** → **[Your Project]** → **Inbound Data Filters**
2. Check if any filters are excluding events
3. Temporarily disable filters to test
4. Look for filters that exclude:
   - Events with specific tags
   - Events from specific environments
   - Test events

### 7. Verify DSN Matches Project

**Common Issue**: DSN doesn't match the Sentry project you're viewing.

**Fix**:
1. In Sentry dashboard, go to **Settings** → **Projects** → **[Your Project]** → **Client Keys (DSN)**
2. Copy the DSN
3. Compare with your environment variable
4. Ensure they match exactly

### 8. Test with Manual Endpoint

Use the test endpoint to manually trigger Sentry events:

```bash
# Test exception capture
curl http://localhost:3000/api/test-sentry?type=exception

# Test message capture
curl http://localhost:3000/api/test-sentry?type=message
```

Then check Sentry dashboard for events tagged with `test: true`.

### 9. Check Browser Console (Client-Side)

For client-side errors, check browser console for Sentry debug logs:

```javascript
// Should see logs like:
[Sentry Client] Initialized for environment: production
[Sentry Client] Event captured: { ... }
```

### 10. Check Server Logs (Server-Side)

For server-side errors, check your deployment logs (Vercel logs):

```bash
# Should see logs like:
[Sentry Server] Initialized for environment: production
[Sentry Server] Event captured: { ... }
```

## Common Configuration Issues

### Issue: Sentry Not Initializing

**Symptoms**: No Sentry logs, errors not appearing

**Causes**:
- DSN not set
- DSN format invalid
- Sentry disabled (`enabled: false`)

**Fix**: Run `npm run verify:env` to check configuration

### Issue: Events Captured But Not Showing

**Symptoms**: Console shows "Event captured" but dashboard is empty

**Causes**:
- Environment filter mismatch
- Date range filter too narrow
- Inbound data filters excluding events
- DSN mismatch

**Fix**: Follow steps 4-7 above

### Issue: Only Some Events Showing

**Symptoms**: Some errors appear, others don't

**Causes**:
- Sample rate too low (`tracesSampleRate: 0.1` = only 10% of events)
- Events filtered by `beforeSend` hook
- Rate limiting in Sentry

**Fix**: Check `tracesSampleRate` in Sentry config files

## Verification Checklist

- [ ] `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is set
- [ ] DSN format is valid (contains `sentry.io` or `ingest.sentry.io`)
- [ ] Environment variable matches Sentry project DSN
- [ ] Sentry dashboard environment filter matches deployment environment
- [ ] Date range includes recent events
- [ ] Inbound data filters aren't excluding events
- [ ] Debug mode enabled (`SENTRY_DEBUG=true`) shows console logs
- [ ] Test endpoint (`/api/test-sentry`) sends events successfully

## Next Steps

1. **Run diagnostic**: `npm run test:sentry`
2. **Check environment**: Verify `VERCEL_ENV` or `NODE_ENV` matches Sentry filter
3. **Enable debug**: Set `SENTRY_DEBUG=true` temporarily
4. **Test manually**: Use `/api/test-sentry` endpoint
5. **Check filters**: Review Sentry dashboard filters (environment, date, inbound data)

## Still Not Working?

If events still don't appear after following all steps:

1. Check Sentry project status (not paused/disabled)
2. Verify Sentry plan limits (free tier has limits)
3. Check network/firewall blocking Sentry API
4. Review Sentry status page: https://status.sentry.io/
5. Contact Sentry support with your DSN and project details

## MCP Integration Troubleshooting

If Sentry MCP tools return 404 errors:

### Common Issues

1. **Missing Environment Variables**
   - `SENTRY_AUTH_TOKEN` not set
   - `SENTRY_ORG` not set or incorrect
   - `SENTRY_PROJECT` not set (optional but recommended)

2. **Invalid Auth Token**
   - Token expired or revoked
   - Token doesn't have required scopes (`org:read`, `project:read`, `event:read`)
   - Token doesn't have access to the organization

3. **Incorrect Organization Slug**
   - Organization slug doesn't match your Sentry account
   - Check URL: `https://sentry.io/organizations/YOUR-ORG-SLUG/`

4. **Project Not Found**
   - Project slug doesn't exist
   - Project is in a different organization

### Fix Steps

1. **Run MCP diagnostic**:
   ```bash
   npm run test:sentry-mcp
   ```

2. **Create/Verify Auth Token**:
   - Go to https://sentry.io/settings/tokens/
   - Create new token with scopes: `org:read`, `project:read`, `event:read`
   - Copy token to `SENTRY_AUTH_TOKEN`

3. **Find Organization Slug**:
   - Go to https://sentry.io/settings/
   - Organization slug is in URL or settings page
   - Set `SENTRY_ORG` to this value

4. **Find Project Slug**:
   - Go to your Sentry project
   - Project slug is in URL: `.../projects/YOUR-PROJECT-SLUG/`
   - Set `SENTRY_PROJECT` to this value

5. **Restart MCP Server**:
   ```bash
   npm run mcp:start
   ```

## Related Files

- `sentry.server.config.ts` - Server-side Sentry configuration
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `instrumentation-client.ts` - Client-side Sentry configuration
- `scripts/test-sentry-integration.ts` - Diagnostic script
- `scripts/test-sentry-mcp.ts` - MCP configuration diagnostic script
- `app/api/test-sentry/route.ts` - Manual test endpoint
- `scripts/mcps/sentry-mcp.ts` - Sentry MCP implementation
