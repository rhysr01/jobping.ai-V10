# Production Cleanup & Monitoring System

## Overview

This system implements automated cleanup of expired users and monitoring of job pool health to ensure data integrity and prevent database bloat.

## Components

### 1. Auto-Cleanup Functions (Database Level)

**Free User Cleanup** (`cleanup_expired_free_users`)
- Deletes free users after 30 days
- Cascades to `user_matches` table (automatic via FK)
- Logs audit trail

**Premium Pending Cleanup** (`cleanup_expired_premium_pending`)
- Deletes premium_pending users who haven't verified after 7 days
- Cascades to `user_matches` table (automatic via FK)
- Logs audit trail

### 2. Cron Endpoints

#### Daily Cleanup: `/api/cron/cleanup-expired-users`
**Schedule**: Daily at 2 AM UTC (via Vercel `vercel.json`)
**Duration**: <1 minute
**Triggers**:
- Free user cleanup function
- Premium pending cleanup function
- Logs results to `cleanup_audit_log` table

**Example Response**:
```json
{
  "success": true,
  "duration": 1234,
  "freed": {
    "users": 15,
    "matches": 75
  },
  "premium": {
    "users": 3,
    "matches": 45
  },
  "total": {
    "users": 18,
    "matches": 120
  }
}
```

#### Job Pool Health: `/api/cron/health-check-job-pool`
**Schedule**: Every 6 hours via Vercel `vercel.json`
**Duration**: <1 minute
**Monitors**:
- Total active jobs across platform
- Job count per city (7-day, 30-day freshness)
- Alerts on critical thresholds

**Thresholds**:
- 🔴 **CRITICAL**: <100 jobs in city (signup will fail)
- 🟡 **WARNING**: <500 jobs in city (free tier struggles)
- 🟡 **WARNING**: <20 jobs in last 7 days (freshness declining)

### 3. Database Constraints

**Cascade Deletes** (`user_matches` → FK to `auth.users`)
```sql
ALTER TABLE public.user_matches
  ADD CONSTRAINT user_matches_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE;
```

When a user is deleted:
- All their `user_matches` are automatically deleted
- No orphaned data remains

## Configuration

### Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired-users",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/health-check-job-pool",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Environment Variables

Required: `SYSTEM_API_KEY` (for authentication)

## KISS Principles Applied

### 1. **Single Responsibility**
- Cleanup endpoint: Only runs cleanup functions
- Health check endpoint: Only monitors metrics
- Database functions: Pure SQL, no application logic

### 2. **Simple Logic**
- No conditional branching in main flow
- Database handles cascade deletes (not application code)
- Thresholds are hardcoded constants (not dynamic)

### 3. **No Secrets in Code**
- Uses `SYSTEM_API_KEY` from environment
- No hardcoded credentials
- Same auth pattern as other cron jobs

### 4. **Testable**
- Each endpoint can be called independently
- Returns structured JSON for assertions
- Audit log table provides history

## Monitoring

### Query Cleanup History
```sql
SELECT * FROM public.cleanup_audit_log
ORDER BY run_at DESC
LIMIT 10;
```

### Check Pending Deletions
```sql
SELECT COUNT(*) as pending_free_deletions
FROM public.users
WHERE 
  subscription_tier = 'free'
  AND free_expires_at < NOW();

SELECT COUNT(*) as pending_premium_pending_deletions
FROM public.users
WHERE 
  subscription_tier = 'premium_pending'
  AND email_verified = false
  AND created_at < NOW() - INTERVAL '7 days';
```

### Job Pool Status
```sql
SELECT city, COUNT(*) as total_jobs, 
  SUM(CASE WHEN posted_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as recent_7d
FROM public.jobs
WHERE is_active = true AND status = 'active'
GROUP BY city
ORDER BY total_jobs DESC;
```

## Fixes Applied

| Issue | Fix | KISS Score |
|-------|-----|-----------|
| Job pool bloat | Added `maxJobsToFetch` limit per tier | ✅ Simple config |
| Orphaned matches | Cascade delete via FK constraint | ✅ Database-level |
| Free user accumulation | Daily cleanup function | ✅ Single responsibility |
| Premium pending limbo | 7-day timeout cleanup | ✅ Automatic |
| No visibility | Health check endpoint + audit log | ✅ Observable |

## Testing

### Local Testing (Development)
```bash
# Cleanup
curl -X POST http://localhost:3000/api/cron/cleanup-expired-users \
  -H "Authorization: Bearer YOUR_SYSTEM_API_KEY"

# Health check
curl -X POST http://localhost:3000/api/cron/health-check-job-pool \
  -H "Authorization: Bearer YOUR_SYSTEM_API_KEY"
```

### Production Verification
- Check Vercel deployment logs for cron execution
- Query `cleanup_audit_log` table for successful runs
- Monitor Sentry for any error alerts
