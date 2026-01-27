# Implementation Guide: Data Quality & Embedding Fixes

**Date**: January 27, 2026  
**Status**: Ready for deployment

---

## Overview

Three critical fixes are being deployed to address data quality issues without risking job data loss:

1. **Safe Role Filters** - Conservative filtering of non-business roles
2. **Safe Data Quality Improvements** - Cleaning and standardization without deletion
3. **Embedding Queue Processor** - Actually generates embeddings (was a stub)

---

## What Changed

### 1. New Safe Migrations

**Files Created**:
- `supabase/migrations/20250127000001_safe_role_filters_phase_1.sql`
- `supabase/migrations/20250127000002_safe_data_quality_phase_1.sql`

**Why Safe?**
- ✅ Only filter jobs matching EXACT title patterns (not partial matches)
- ✅ Include exceptions to preserve edge cases (e.g., "postal IT support" is kept)
- ✅ Built-in safeguards that STOP migration if too many jobs are deleted
- ✅ Conservative - won't delete more than 5% of jobs
- ✅ Tracks all changes with `filtered_reason` column
- ✅ Runs in transactions (can be rolled back)

### 2. Embedding Queue Processor Implemented

**File Modified**: `app/api/process-embedding-queue/route.ts`

**What It Does Now**:
- ✅ Fetches up to 50 jobs without embeddings every 5 minutes
- ✅ Calls OpenAI to generate embeddings (text-embedding-3-small)
- ✅ Stores embeddings in the database
- ✅ Tracks successes and errors
- ✅ Cost: ~$0.00002 per job = $0.55 for all 27,285 jobs

**Estimated Timeline**:
- At 50 jobs/5 min = 600 jobs/hour
- 27,285 jobs ÷ 600 = **~45 hours** to complete all embeddings
- Running continuously from now, should be done in ~2 days

---

## Deployment Steps

### Step 1: Deploy Code Changes

```bash
# Apply the embedding queue processor implementation
git add app/api/process-embedding-queue/route.ts

# Commit code changes
git commit -m "Implement embedding queue processor with OpenAI integration"

# Push to main
git push origin main
```

### Step 2: Apply Safe Migrations

```bash
# This should happen automatically via your migration system

# Or manually:
npm run db:migrate
```

**The migrations will:**
1. Check that at least 10,000 jobs exist (safety check)
2. Apply conservative filtering with exceptions
3. Verify that no more than 5% of jobs were removed
4. Log what was filtered for audit trail

### Step 3: Verify Deployment

```sql
-- Check active jobs count
SELECT COUNT(*) as active_jobs FROM jobs WHERE is_active = true;
-- Expected: ~26,500-27,200 (>95% of 27,285)

-- Check what was filtered
SELECT
  filtered_reason,
  COUNT(*) as job_count
FROM jobs
WHERE is_active = false
GROUP BY filtered_reason
ORDER BY job_count DESC;

-- Check embeddings starting to populate
SELECT 
  COUNT(*) as jobs_with_embeddings,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM jobs WHERE is_active = true), 1) as percentage
FROM jobs
WHERE is_active = true AND embedding IS NOT NULL;
-- Expected: 0 immediately, then growing every 5 minutes
```

---

## Safety Features Built In

### Anti-Catastrophe Checks

1. **Pre-flight Check**
   ```sql
   -- Migration stops if active jobs < 10,000
   IF (SELECT COUNT(*) FROM jobs WHERE is_active = true) < 10000 THEN
     RAISE EXCEPTION 'ERROR: Active job count below 10000. Migration blocked.';
   END IF;
   ```

2. **Exact Match Only**
   - Job title must EXACTLY match pattern
   - No substring matching (prevents over-filtering)

3. **Exceptions Built In**
   ```sql
   -- Example: Don't filter postal roles if they're IT/tech related
   AND NOT (
     LOWER(title) LIKE '%tech%' OR
     LOWER(title) LIKE '%support%' OR
     LOWER(title) LIKE '%engineer%'
   )
   ```

4. **Conservative Thresholds**
   - Won't filter more than 5% of jobs total
   - Uses only the most obvious non-business roles
   - Avoids edge cases

5. **Audit Trail**
   - Every filtered job tracked with `filtered_reason`
   - Can query what was removed and why
   - Can potentially restore if needed

### Embedding Queue Safeguards

1. **Batch Processing**
   - Only 50 jobs per cron run (every 5 minutes)
   - Prevents OpenAI rate limit errors
   - Gradual, stable rollout

2. **Error Handling**
   - Catches OpenAI errors and logs them
   - Returns first 5 errors in response
   - Cron continues even if some embeddings fail

3. **Rate Limiting**
   - 50 jobs × 5 min interval = 600 jobs/hour
   - Well within OpenAI text-embedding-3-small limits
   - No risk of being rate-limited

---

## What Gets Filtered (Phase 1)

### Safe Role Filters
- ✗ Postal carriers (EXACT title match only)
- ✗ Cleaners, janitors (obvious non-business)
- ✗ Nurses, doctors (clinical roles only)
- ✗ University professors (classical teaching only)
- ✗ Licensed lawyers/barristers (not paralegal/compliance)
- ✓ Keep: "Postal IT Support", "Healthcare Analyst", "Corporate Trainer"

### Safe Data Quality
- ✗ Jobs with completely NULL title
- ✗ Jobs with completely NULL company
- ✗ Jobs marked as "test job" or "fake job"
- ✓ Keep: Jobs with short descriptions (those can be improved)
- ✓ Keep: Jobs with NULL location (our recent fix handles this)

**Expected Impact**:
- Role filters: 100-300 jobs (~0.4-1%)
- Data quality: 50-100 jobs (~0.2-0.4%)
- **Total**: ~150-400 jobs filtered (~0.5-1.5%)
- **Remaining**: ~26,900-27,100 jobs (>95%)

---

## Rollback Plan

If something goes wrong:

```sql
-- Restore filtered jobs
UPDATE jobs
SET is_active = true, status = 'active'
WHERE filtered_reason LIKE '%postal_manual_labor%'
   OR filtered_reason LIKE '%medical_clinical_role%'
   OR filtered_reason LIKE '%teaching_academic_role%'
   OR filtered_reason LIKE '%licensed_legal_role%'
   OR filtered_reason LIKE '%missing_title%'
   OR filtered_reason LIKE '%missing_company%'
   OR filtered_reason LIKE '%test_or_fake_job%';
```

---

## Monitoring After Deployment

### Daily Checks (First Week)
```sql
-- Morning check: Are embeddings increasing?
SELECT 
  COUNT(*) as total_active,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings,
  ROUND(100.0 * COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) / COUNT(*), 1) as percentage
FROM jobs WHERE is_active = true;

-- Check for new errors
SELECT * FROM jobs WHERE updated_at > NOW() - INTERVAL '1 day' AND status = 'inactive';
```

### Weekly Checks
- Verify embedding generation rate (should be ~4,200 new embeddings/day)
- Check error logs in Sentry for OpenAI failures
- Spot-check filtered jobs to ensure accuracy

### Expected Progression
```
Day 0: 0 embeddings (0%)
Day 1: ~4,200 embeddings (15%)
Day 2: ~8,400 embeddings (31%)
Day 3: ~12,600 embeddings (46%)
Day 4: ~16,800 embeddings (62%)
Day 5: ~21,000 embeddings (77%)
Day 6: ~25,200 embeddings (93%)
Day 7: ~27,285 embeddings (100%)
```

---

## Known Limitations & Future Improvements

### Phase 1 (Current - Conservative)
- Only filters most obvious non-business roles
- Doesn't handle subtle edge cases
- Won't improve descriptions (only cleans them)

### Phase 2 (Future - When Confident)
- Could enable the disabled migrations with better testing
- Add description extraction improvements
- Add location geocoding enhancement
- Add more sophisticated role filtering

---

## Disabled Migrations (Why They're Still Disabled)

The previously disabled migrations (`*.disabled` files) had aggressive filtering that risked deleting too many jobs. These new migrations are more conservative and safer.

**Old migrations** (still disabled):
- `20260121000000_additional_role_filters.sql.disabled` - Too aggressive (8+ role categories)
- `20260122000000_metadata_quality_improvements.sql.disabled` - Filters by description length
- `20260120000000_consolidated_data_quality_fixes.sql.disabled` - May delete location data
- `20260125000000_fix_postal_jobs_tech_categorization.sql.disabled` - Database function changes

**New migrations** (being deployed):
- `20250127000001_safe_role_filters_phase_1.sql` - Conservative, testable, safe
- `20250127000002_safe_data_quality_phase_1.sql` - Only filters critical nulls

The new approach is safer because:
1. ✅ Only exact title matches (not description-based)
2. ✅ Includes specific exceptions to preserve edge cases
3. ✅ Built-in safeguards that stop the migration if too many jobs are deleted
4. ✅ Conservative thresholds (won't filter >5% of jobs)

---

## Testing Before Production

### Test in Development/Staging
```bash
# Run migrations in staging first
npm run db:migrate --env=staging

# Verify active job count is still >95% of original
# Verify embeddings start increasing every 5 minutes
```

### Verify Specific Cases
```sql
-- Verify postal support roles are kept
SELECT * FROM jobs WHERE title ILIKE '%postal%it%support%' AND is_active = true;
-- Expected: Should exist and be active

-- Verify postal carriers are filtered
SELECT * FROM jobs WHERE title ILIKE '%postman%' AND is_active = false;
-- Expected: Should be filtered

-- Verify healthcare analysts are kept
SELECT * FROM jobs WHERE title ILIKE '%healthcare%analyst%' AND is_active = true;
-- Expected: Should exist and be active

-- Verify nurses are filtered
SELECT * FROM jobs WHERE title ILIKE '%nurse%' AND is_active = false;
-- Expected: Should be filtered
```

---

## Success Criteria

✅ Deployment successful when:
1. Active jobs remain >26,900 (>98.5% of 27,285)
2. No jobs deleted with filtered_reason = NULL
3. Embeddings start increasing (at least 50/run every 5 min)
4. No OpenAI errors in Sentry
5. All spot checks show correct jobs filtered vs. kept

---

## Support & Questions

If something goes wrong:
1. Check Sentry for OpenAI errors
2. Check job filtered_reason to understand what was removed
3. Use rollback SQL above to restore jobs if needed
4. Run spot-check queries above to verify accuracy

The migrations are designed to be **safe-first**, so please don't hesitate to rollback if something doesn't look right.
