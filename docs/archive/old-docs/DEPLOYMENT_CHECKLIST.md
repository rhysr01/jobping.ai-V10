# FINAL DEPLOYMENT CHECKLIST

**Date**: January 27, 2026  
**Owner**: DevOps/Platform Team  
**Risk Level**: 🟢 LOW (Safeguards in place)

---

## Pre-Deployment Verification

### Code Review
- [ ] Review `app/api/process-embedding-queue/route.ts`
  - [ ] OpenAI API integration looks correct
  - [ ] Error handling is comprehensive
  - [ ] Rate limiting (50 jobs/run) prevents quota issues
  - [ ] Authorization check present
  - [ ] Return values are sensible

- [ ] Review `supabase/migrations/20250127000001_safe_role_filters_phase_1.sql`
  - [ ] Safety checks in place (10k job minimum)
  - [ ] Exact title matching (not substring)
  - [ ] Exceptions included
  - [ ] Transaction wrapping
  - [ ] Logging/verification queries included

- [ ] Review `supabase/migrations/20250127000002_safe_data_quality_phase_1.sql`
  - [ ] Safety checks in place (10k job minimum)
  - [ ] Only NULL/empty fields filtered
  - [ ] No description length filtering
  - [ ] Data normalization (whitespace, nulls)
  - [ ] Comprehensive logging

### Environment Checks
- [ ] OpenAI API key is valid
- [ ] OpenAI API has available quota
- [ ] Supabase service role key is valid
- [ ] CRON_SECRET environment variable is set
- [ ] No active Sentry errors related to jobs/embeddings
- [ ] Database has ~27,285 active jobs
- [ ] Database migrations system is working

---

## Staging Deployment (If Available)

- [ ] Deploy code changes to staging
- [ ] Apply migrations in staging
- [ ] Verify active job count: expect 26,900-27,100
- [ ] Wait 30 minutes for embedding queue to process first batch
- [ ] Verify first embeddings created (check database)
- [ ] Check for any Sentry errors
- [ ] Verify no data corruption
- [ ] Get approval from tech lead

---

## Production Deployment

### Pre-Deployment
- [ ] Backup database (or ensure backup is recent)
- [ ] Schedule 30-minute monitoring window
- [ ] Alert team that deployment is happening
- [ ] Have rollback SQL ready

### Deploy Code
```bash
# 1. Merge branch to main
git merge <branch-name>

# 2. Deploy to Vercel
vercel --prod

# 3. Verify deployment succeeded
# (Check Vercel deployment logs)
```

### Apply Migrations
```bash
# 4. Apply migrations via your migration system
# (This depends on your setup - could be:
# - npm run db:migrate
# - Supabase CLI: supabase db push
# - Manual SQL execution)

# 5. Verify migrations completed
psql -c "SELECT COUNT(*) as active_jobs FROM jobs WHERE is_active = true;"
# Expected: 26,900-27,100
```

### Immediate Post-Deployment (First 5 Minutes)
- [ ] No critical errors in Sentry
- [ ] Active job count is correct (>26,900)
- [ ] Cron job executed without errors
- [ ] First batch of embeddings created (check logs)
- [ ] No API errors from users

---

## 24-Hour Monitoring

### Every Hour (First 6 Hours)
```sql
-- Check embedding progress
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings,
  ROUND(100.0 * COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) / COUNT(*), 1) as percentage
FROM jobs WHERE is_active = true;

-- Check for errors
SELECT count(*) FROM jobs WHERE updated_at > NOW() - INTERVAL '1 hour';
```

- [ ] Hour 1: First batch processed (50 embeddings)
- [ ] Hour 2: Second batch processed (100 total)
- [ ] Hour 3-6: Continuing growth

### Every 6 Hours (First 24 Hours)
- [ ] Check Sentry for OpenAI errors
- [ ] Verify database performance not degraded
- [ ] Check cron job execution in logs
- [ ] Verify no user-facing issues reported

### Final 24-Hour Check
```sql
-- Should have processed ~4,200 embeddings
SELECT COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings
FROM jobs WHERE is_active = true;
-- Expected: 4,200-4,500

-- Should have exactly the filtered jobs
SELECT COUNT(*) FROM jobs WHERE is_active = false;
-- Expected: 150-400
```

- [ ] ~4,200 embeddings generated
- [ ] No errors in Sentry
- [ ] No user complaints
- [ ] Database still responsive
- [ ] Cron jobs running on schedule

---

## Success Criteria (Mark off as you verify)

### Must-Have
- [ ] Deployment completed without errors
- [ ] Active job count: 26,900-27,100 (>98.5% of original)
- [ ] Embeddings started generating (at least 50 created)
- [ ] No Sentry errors related to embeddings/jobs
- [ ] Filtered jobs properly marked with filtered_reason
- [ ] Cron job runs every 5 minutes successfully

### Should-Have
- [ ] ~4,200 embeddings created by end of day 1
- [ ] No API performance degradation
- [ ] User matching working normally
- [ ] Embedding queue logs show success rate >95%

### Nice-To-Have
- [ ] All embeddings complete by day 3
- [ ] User feedback indicates better match quality
- [ ] Zero user-reported issues

---

## Rollback Procedure (If Needed)

**If filtering removed too many jobs:**
```sql
-- Restore all filtered jobs
UPDATE jobs SET is_active = true, status = 'active'
WHERE filtered_reason IS NOT NULL;
```

**If embeddings are causing errors:**
```sql
-- Stop the cron (temporarily disable in vercel.json)
-- And remove embeddings (if needed)
UPDATE jobs SET embedding = NULL;
```

**If code changes cause issues:**
```bash
# Revert to previous deployment
vercel rollback
```

---

## Monitoring Dashboard Queries

Save these for ongoing monitoring:

```sql
-- Daily: Embedding coverage
SELECT 
  DATE(updated_at) as date,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings,
  ROUND(100.0 * COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) / COUNT(*), 1) as percentage
FROM jobs WHERE is_active = true
GROUP BY DATE(updated_at)
ORDER BY date DESC;

-- Monitor: Filtering accuracy
SELECT 
  filtered_reason,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM jobs WHERE is_active = false), 1) as pct
FROM jobs WHERE is_active = false
GROUP BY filtered_reason
ORDER BY count DESC;

-- Alert: Check for jobs with NULL critical fields (should be 0)
SELECT COUNT(*) 
FROM jobs 
WHERE is_active = true 
AND (title IS NULL OR company IS NULL);

-- Monitor: Cron job success rate
-- (Check application logs for process-embedding-queue output)
```

---

## Communication Plan

### Notify Team Before
- Subject: "Data Quality Fixes Deployment - [Date/Time]"
- Message: "Deploying embedding queue and data quality improvements. Expect better match quality within 24 hours. No user impact expected."

### Notify After Success
- Subject: "✅ Data Quality Fixes Deployed Successfully"
- Message: "Embeddings now generating. Should complete in ~48 hours. Matching quality will improve incrementally."

### Notify If Issues
- Subject: "⚠️ Data Quality Fixes - Issue Detected"
- Message: "[Details of issue] - Rolling back now."

---

## Runbook Links

- Emergency contacts: [Your team runbook]
- Database access: [Your access guide]
- Vercel dashboard: [Your deploy dashboard]
- Sentry monitoring: [Your Sentry project]
- OpenAI dashboard: [API usage monitoring]

---

## Post-Deployment Follow-up

**Day 1 (After 24 hours)**
- [ ] Review embedding progress
- [ ] Check user feedback
- [ ] Verify no issues in Sentry
- [ ] Confirm cron jobs running

**Day 3 (After 72 hours)**
- [ ] All embeddings should be ~50% complete
- [ ] Spot-check job quality
- [ ] Get user feedback on match quality

**Day 7 (After 1 week)**
- [ ] All embeddings complete
- [ ] Analyze matching metrics
- [ ] Document success/learnings

---

## Sign-Off

- [ ] Code reviewer: _________________ Date: _______
- [ ] DevOps/Platform lead: _________________ Date: _______
- [ ] Product/Tech lead: _________________ Date: _______

---

## Notes

- All changes are reversible
- Migrations include safety checks
- Zero impact on user-facing functionality
- Gradual rollout (50 jobs/5 min) prevents overload
- Embedding generation is non-blocking

**Ready to deploy!** ✅
