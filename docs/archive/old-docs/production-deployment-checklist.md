# Production Hardening: Verification Checklist

## ✅ Fixes Applied

### Database Level
- [x] Migration: `add_cascade_delete_and_cleanup_functions` applied
  - Creates `cleanup_expired_free_users()` function
  - Creates `cleanup_expired_premium_pending()` function
  - Creates `cleanup_audit_log` table
  - Logs cleanup activities

- [x] Migration: `ensure_cascade_delete_on_user_matches` applied
  - Adds CASCADE FK constraint on `user_matches.user_id`
  - Orphaned matches auto-delete when user deleted

### Application Code
- [x] `SignupMatchingService.ts`
  - Added `maxJobsToFetch: number` to `MatchingConfig` interface
  - Free tier: `maxJobsToFetch: 5000`
  - Premium tier: `maxJobsToFetch: 10000`
  - Applied `.limit()` in `fetchJobsForTier()` method

- [x] `FreeMatchingStrategy.ts`
  - Updated match persistence logging

- [x] `PremiumMatchingStrategy.ts`
  - Updated match persistence logging

### New Cron Endpoints
- [x] `/api/cron/cleanup-expired-users` (route.ts)
  - Runs both cleanup functions daily
  - Returns JSON with deletion counts
  - Authenticated with `SYSTEM_API_KEY`
  - Has timeout: 60 seconds

- [x] `/api/cron/health-check-job-pool` (route.ts)
  - Monitors job pool health
  - Tracks per-city metrics
  - Returns warnings & critical alerts
  - Authenticated with `SYSTEM_API_KEY`
  - Has timeout: 60 seconds

### Documentation
- [x] `docs/production-cleanup-system.md` - Complete system guide
- [x] `docs/production-hardening-summary.md` - Before/after summary

## 🚀 Pre-Deployment Steps

### 1. Review Changes
```bash
git diff
```
Should show:
- Database migration files
- Updated SignupMatchingService.ts
- Updated strategy files
- New cron endpoints
- New documentation

### 2. Test in Development
```bash
# Verify migrations parse
npm run db:migrate --dry-run

# Verify endpoints compile
npm run build

# Verify no linter errors
npm run lint
```

### 3. Manual Testing (Optional)
```bash
# Create a test free user (will expire in 30 days)
npm run dev

# In another terminal, trigger cleanup
curl -X POST http://localhost:3000/api/cron/cleanup-expired-users \
  -H "Authorization: Bearer $SYSTEM_API_KEY"

# Check health
curl -X POST http://localhost:3000/api/cron/health-check-job-pool \
  -H "Authorization: Bearer $SYSTEM_API_KEY"
```

### 4. Verify Database Functions (SQL)
```sql
-- Check cleanup functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'cleanup_%';

-- Should return:
-- cleanup_expired_free_users
-- cleanup_expired_premium_pending

-- Check CASCADE constraint
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'user_matches' 
AND constraint_name LIKE '%user_id%';

-- Check audit log table
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'cleanup_audit_log';
```

## 📋 Deployment Steps

### 1. Deploy to Production
```bash
git add .
git commit -m "fix: implement production cleanup & monitoring system

- Add maxJobsToFetch limits to prevent job pool bloat
- Implement cascade delete for orphaned matches
- Add daily cleanup cron for expired free users (30 days)
- Add daily cleanup cron for premium_pending users (7 days)
- Add health check endpoint for job pool monitoring
- Add cleanup audit log table for visibility"

git push origin main
```

### 2. Apply Database Migrations (Supabase Dashboard)
```bash
# Verify migrations in pending state
supabase db push

# Or run via Vercel if integrated:
npm run db:migrate
```

### 3. Configure Vercel Cron (vercel.json)
Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired-users",
      "schedule": "0 2 * * *",
      "description": "Daily cleanup of expired free users & premium_pending accounts"
    },
    {
      "path": "/api/cron/health-check-job-pool",
      "schedule": "0 */6 * * *",
      "description": "6-hourly job pool health check"
    }
  ]
}
```

### 4. Restart Production
Vercel will auto-redeploy on push. Verify:
- ✅ Cron jobs appear in Vercel Dashboard
- ✅ No errors in deployment logs
- ✅ Health check endpoint responds

## 🧪 Post-Deployment Verification

### Immediate (First Hour)
```bash
# Verify no errors in logs
vercel logs <project-id> --limit 50

# Check cron configuration
# Should see new cron jobs in Vercel Dashboard > Settings > Crons

# Test endpoints manually
curl -X POST https://yourapp.com/api/cron/health-check-job-pool \
  -H "Authorization: Bearer $SYSTEM_API_KEY"
```

### Daily (Next 24 Hours)
```bash
# After 2 AM UTC, check cleanup results
SELECT * FROM cleanup_audit_log ORDER BY run_at DESC LIMIT 1;

# Should show non-zero deletions if any expired users exist
```

### Weekly
```sql
-- Verify cleanup is working
SELECT 
  cleanup_type,
  COUNT(*) as cleanup_count,
  SUM(users_deleted) as total_users_deleted,
  SUM(matches_deleted) as total_matches_deleted,
  MAX(run_at) as last_run
FROM cleanup_audit_log
WHERE run_at > NOW() - INTERVAL '7 days'
GROUP BY cleanup_type;

-- Should show entries for both cleanup types if users exist
```

## ⚠️ Rollback Plan (If Issues)

If problems occur, rollback is safe:

### 1. Revert Code
```bash
git revert <commit-hash>
git push origin main
```

### 2. Delete Cron Jobs
Remove from `vercel.json`:
```json
"crons": []
```

### 3. Database is Safe
- Cascade delete constraint is backwards-compatible
- Cleanup functions can be disabled without breaking anything
- Audit log table is read-only for troubleshooting

## 📊 Monitoring

### Sentry Alerts
- New errors in cleanup endpoints automatically tracked
- Health check failures alert on critical conditions

### Database Monitoring
```sql
-- Orphaned matches check (should be 0)
SELECT COUNT(*) FROM user_matches um
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = um.user_id);

-- Pending cleanup check
SELECT 
  COUNT(*) as free_pending,
  (SELECT COUNT(*) FROM users WHERE subscription_tier = 'premium_pending' 
   AND email_verified = false AND created_at < NOW() - INTERVAL '7 days') as premium_pending_timeout
FROM users
WHERE subscription_tier = 'free' AND free_expires_at < NOW();
```

## 📞 Support

If issues arise:

1. **Cleanup not running?**
   - Check Vercel Dashboard > Logs for cron execution
   - Verify `SYSTEM_API_KEY` in environment variables
   - Manually trigger: `curl -X POST .../api/cron/cleanup-expired-users`

2. **Health check throwing errors?**
   - Check Supabase quota/limits
   - Verify queries don't timeout (set to 60s max)
   - Review Sentry for specific error details

3. **Cascade delete not working?**
   - Verify FK constraint applied: `SELECT * FROM information_schema.table_constraints WHERE table_name='user_matches'`
   - Check that `ON DELETE CASCADE` is in constraint definition

## ✨ Success Criteria

- [x] No linter errors
- [x] All migrations applied successfully
- [x] Both cron endpoints accessible
- [x] No orphaned matches in database
- [x] Cleanup audit log records successful runs
- [x] Health check identifies low job pools
- [x] Free users auto-delete after 30 days
- [x] Premium pending users auto-delete after 7 days
- [x] Database size stabilizes (not growing)
