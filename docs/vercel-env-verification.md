# Vercel Environment Variables Verification

## Overview

This document describes how to use the Vercel MCP tools to ensure environment variables are set correctly in your Vercel project.

## Quick Start

Run the verification script:

```bash
npm run ensure:vercel-env
```

This script will:
1. ✅ Find your Vercel project automatically
2. ✅ Check all required environment variables
3. ✅ Validate variable formats
4. ✅ Report any missing or incorrectly configured variables
5. ✅ Provide instructions on how to fix issues

## Required Environment Variables

The following variables **must** be set for all environments (Production, Preview, Development):

1. **NEXT_PUBLIC_SUPABASE_URL** - Supabase database URL
2. **SUPABASE_SERVICE_ROLE_KEY** - Supabase service role key (min 20 chars)
3. **RESEND_API_KEY** - Resend API key (must start with `re_`)
4. **INTERNAL_API_HMAC_SECRET** - HMAC secret for internal APIs (min 32 chars)
5. **SYSTEM_API_KEY** - System API key (min 10 chars)

## Recommended Variables

These are optional but recommended:

- **OPENAI_API_KEY** - OpenAI API key (must start with `sk-`)
- **REDIS_URL** - Redis connection URL
- **SENTRY_DSN** - Sentry DSN for error tracking
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Supabase anonymous key

## Available Scripts

### Check Environment Variables

```bash
npm run check:vercel-env [project-id]
```

Shows current environment variables for a Vercel project. If no project ID is provided, it will list all projects.

### Ensure Environment Variables

```bash
npm run ensure:vercel-env
```

Comprehensive check that validates all required variables and their formats. This is the recommended script to use.

### Show Values from .env.local

```bash
npm run show:vercel-env
```

Displays the values from your `.env.local` file that should be copied to Vercel.

## How to Fix Missing Variables

If the script reports missing variables:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `jobping-ai-v10`

2. **Navigate to Environment Variables**
   - Go to: Settings → Environment Variables

3. **Add Each Variable**
   - Click "Add Environment Variable"
   - Enter the exact variable name (case-sensitive)
   - Copy the value from your `.env.local` file
   - **IMPORTANT**: Select ALL environments:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click "Save"

4. **Redeploy**
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - Variables only apply to NEW deployments

## Common Issues

### Variables Not Appearing After Adding

- Variables only apply to **new deployments**
- You must **redeploy** after adding variables
- Check that variables are set at **PROJECT level**, not Team level

### Environment Mismatch

- Variables set for Production won't be available in Preview deployments
- Make sure to set variables for **ALL environments** (Production, Preview, Development)

### Variable Name Typos

- Variable names are **case-sensitive**
- Copy names exactly from the error message or documentation
- Common mistakes:
  - `NEXT_PUBLIC_SUPABASE_URL` ✅ (correct)
  - `NEXT_PUBLIC_SUPABASE_url` ❌ (wrong case)
  - `NEXT_PUBLIC_SUPABASE-URL` ❌ (wrong character)

### Value Format Issues

- **RESEND_API_KEY** must start with `re_`
- **OPENAI_API_KEY** must start with `sk-`
- **SUPABASE_SERVICE_ROLE_KEY** must be at least 20 characters
- **INTERNAL_API_HMAC_SECRET** must be at least 32 characters

## Using Vercel MCP Tools

The verification script uses the Vercel MCP (Model Context Protocol) tools. These tools are also available through the MCP server:

- `vercel_get_projects` - List all Vercel projects
- `vercel_get_environment_variables` - Get environment variables for a project
- `vercel_set_environment_variable` - Set an environment variable (requires API permissions)

## Verification Results

When you run `npm run ensure:vercel-env`, you'll see:

- ✅ **Green checkmarks** - Variable is set correctly for all environments
- ⚠️ **Yellow warnings** - Variable is set but missing some environments
- ❌ **Red errors** - Variable is missing or incorrectly configured

## Troubleshooting

If you're still experiencing issues after verifying variables:

1. **Check Deployment Logs**
   - Go to Vercel Dashboard → Deployments
   - Click on a deployment → View logs
   - Look for environment variable errors

2. **Verify Variable Values**
   - Use the "Show" button in Vercel to verify values are saved correctly
   - Check for truncation (especially for long JWT tokens)

3. **Check Project Level**
   - Make sure variables are set at the **project level**, not team level
   - Team-level variables must be explicitly linked to projects

4. **Redeploy**
   - Always redeploy after adding or modifying environment variables
   - Variables added after a deployment starts won't be available until the next deployment

## Related Documentation

- [Vercel Environment Variables Setup](./vercel-env-setup.md)
- [Vercel Environment Variables Troubleshooting](./vercel-env-troubleshooting.md)
- [Error Fix Plan](./ERROR_FIX_PLAN.md) - See Issue 2.1 for OpenAI API key configuration
