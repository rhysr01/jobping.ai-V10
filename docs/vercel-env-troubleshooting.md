# Troubleshooting: Environment Variables Not Loading in Vercel

## Problem
You've added environment variables in Vercel, but they're still showing as `undefined/empty` in your deployment logs.

## Common Causes & Solutions

### 1. ⚠️ **Environment Mismatch** (Most Common)

**Problem**: Variables are set for Production, but you're deploying to Preview (or vice versa).

**How to Check**:
- Look at your deployment logs for: `VERCEL_ENV: preview` or `VERCEL_ENV: production`
- Visit `/api/debug/env-check` on your deployed site to see which environment you're in

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. For **each** variable, check which environments are selected:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
3. Make sure **ALL** environments are checked, not just Production

### 2. ⚠️ **Deployment Timing** (Very Common)

**Problem**: You added variables but didn't redeploy. Variables only apply to **new** deployments.

**Solution**:
1. After adding variables, go to **Deployments** tab
2. Click **"Redeploy"** on your latest deployment
3. OR push a new commit to trigger a fresh deployment

**Important**: Variables added after a deployment starts won't be available until the next deployment.

### 3. ⚠️ **Variable Name Typos**

**Problem**: Variable names are case-sensitive and must match exactly.

**Check**:
- `NEXT_PUBLIC_SUPABASE_URL` ✅ (correct)
- `NEXT_PUBLIC_SUPABASE_url` ❌ (wrong case)
- `NEXT_PUBLIC_SUPABASE-URL` ❌ (wrong character)

**Solution**: Copy variable names exactly from the error message or documentation.

### 4. ⚠️ **Value Truncation**

**Problem**: Long values might be cut off when copying/pasting.

**Solution**: 
- Double-check that full values are copied (especially for JWT tokens)
- Use "Show" button in Vercel to verify full value is saved

### 5. ⚠️ **Multiple Projects**

**Problem**: Variables added to wrong Vercel project.

**Solution**: 
- Verify you're in the correct project
- Check project name matches your repository

## Debugging Steps

### Step 1: Check What Vercel Sees

Visit your deployed site:
```
https://your-domain.vercel.app/api/debug/env-check
```

This will show:
- Which environment you're in (production/preview/development)
- Which variables are set
- Which variables are missing
- Total number of environment variables available

### Step 2: Check Deployment Logs

In Vercel Dashboard → Deployments → [Your Deployment] → Logs:

Look for:
```
🔍 Diagnostic Information:
   VERCEL_ENV: preview  ← This tells you which environment
   VERCEL_URL: ...
```

### Step 3: Verify in Vercel Dashboard

1. Go to: **Settings → Environment Variables**
2. For each required variable, verify:
   - ✅ Name matches exactly (case-sensitive)
   - ✅ Value is complete (not truncated)
   - ✅ All environments checked (Production, Preview, Development)

### Step 4: Force Redeploy

After verifying variables:
1. Go to **Deployments** tab
2. Click **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete
5. Check logs again

## Quick Checklist

- [ ] Variables added in Vercel Dashboard
- [ ] Variables set for **ALL** environments (Production, Preview, Development)
- [ ] Variable names match exactly (case-sensitive)
- [ ] Values are complete (not truncated)
- [ ] Project redeployed after adding variables
- [ ] Checked `/api/debug/env-check` to verify variables are loaded
- [ ] Checked deployment logs for `VERCEL_ENV` value

## Still Not Working?

1. **Double-check variable names**: Copy directly from error message
2. **Check environment**: Use `/api/debug/env-check` endpoint
3. **Verify redeploy**: Make sure you redeployed AFTER adding variables
4. **Check Vercel status**: Sometimes Vercel has delays syncing variables
5. **Try removing and re-adding**: Delete variables and add them again

## Required Variables

Make sure these 5 are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `INTERNAL_API_HMAC_SECRET`
- `SYSTEM_API_KEY`

## Example: Correct Setup

In Vercel Dashboard → Environment Variables:

```
Variable Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://kpecjbjtdjzgkzywylhn.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

Repeat for all 5 required variables.
