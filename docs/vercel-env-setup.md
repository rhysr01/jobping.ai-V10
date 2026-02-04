# Setting Up Environment Variables in Vercel

## ⚠️ CRITICAL: Required Environment Variables Missing

Your deployment is failing because required environment variables are not configured in Vercel. The `.env.local` file is only for local development and is **not** deployed to Vercel.

## Required Environment Variables

These variables **must** be set in Vercel for your deployment to work:

### Critical (Required)

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value from `.env.local`: `https://kpecjbjtdjzgkzywylhn.supabase.co`
   - Purpose: Supabase database connection URL

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Value from `.env.local`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZWNqYmp0ZGp6Z2t6eXd5bGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgwMDU0MywiZXhwIjoyMDY5Mzc2NTQzfQ.aWpwACh4WgG6QkMcLWVMnqh3vUV7_MDpiYTJUU4y2Qw`
   - Purpose: Supabase service role key for server-side operations

3. **RESEND_API_KEY**
   - Value from `.env.local`: `re_WzZCAnNN_HAypfg9exMKH2rtCvfc6YPsB`
   - Purpose: Email delivery via Resend

4. **INTERNAL_API_HMAC_SECRET**
   - Value from `.env.local`: `ac232f94b539a84a5f866e88867327dbc5f5beb82450712d63502a20cfde6c1e`
   - Purpose: HMAC signing for internal API authentication

5. **SYSTEM_API_KEY**
   - Value from `.env.local`: `0a24874bef0ce944436759a684fcd55e8db9896d5907bc34ae4966cc5371d49`
   - Purpose: System-level API authentication

## How to Fix

### Step 1: Access Vercel Dashboard

1. Go to: **https://vercel.com/dashboard**
2. Select your project
3. Navigate to: **Settings → Environment Variables**

### Step 2: Add Each Variable

For **each** variable above:

1. Click **"Add New"**
2. Enter the **Name** (exactly as shown above)
3. Enter the **Value** (copy from your `.env.local` file)
4. Select **all environments**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional but recommended)
5. Click **"Save"**

### Step 3: Verify All Variables Are Set

You should have these 5 variables configured:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] RESEND_API_KEY
- [ ] INTERNAL_API_HMAC_SECRET
- [ ] SYSTEM_API_KEY

### Step 4: Redeploy

After adding all variables:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment, OR
3. Push a new commit to trigger automatic deployment

## Additional Recommended Variables

While not required for basic functionality, these are recommended:

- **OPENAI_API_KEY** - For AI-powered job matching
- **REDIS_URL** - For distributed rate limiting and caching
- **SENTRY_DSN** - For error tracking and monitoring
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** - For client-side Supabase operations

## Quick Copy-Paste Checklist

```
✅ NEXT_PUBLIC_SUPABASE_URL=https://kpecjbjtdjzgkzywylhn.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZWNqYmp0ZGp6Z2t6eXd5bGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgwMDU0MywiZXhwIjoyMDY5Mzc2NTQzfQ.aWpwACh4WgG6QkMcLWVMnqh3vUV7_MDpiYTJUU4y2Qw
✅ RESEND_API_KEY=re_WzZCAnNN_HAypfg9exMKH2rtCvfc6YPsB
✅ INTERNAL_API_HMAC_SECRET=ac232f94b539a84a5f866e88867327dbc5f5beb82450712d63502a20cfde6c1e
✅ SYSTEM_API_KEY=0a24874bef0ce944436759a684fcd55e8db9896d5907bc34ae4966cc5371d49
```

## Troubleshooting

### Error: "Environment variable validation failed"

- ✅ Check that variable names match **exactly** (case-sensitive)
- ✅ Check that values are copied completely (no truncation)
- ✅ Ensure variables are set for the correct environment (Production/Preview)
- ✅ Redeploy after adding variables

### Variables Not Appearing After Adding

- Variables are only available to **new deployments**
- You must **redeploy** after adding variables
- Check deployment logs to verify variables are loaded

### Security Note

⚠️ **Never commit `.env.local` to git** - it contains sensitive credentials. Always set these in Vercel's dashboard instead.

## Verification

After redeploying, check your deployment logs. You should see:
- ✅ No environment variable validation errors
- ✅ Successful application startup
- ✅ API endpoints responding correctly

If errors persist, check the deployment logs for specific validation messages.
