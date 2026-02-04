# Deployment Checklist - Free Signup Duplicate Match Fix

## Overview
Fixing: `Failed to save matches: duplicate key value violates unique constraint "user_matches_unique"`

## Prerequisites
- [ ] Have Supabase CLI installed and configured
- [ ] Have access to the Supabase project
- [ ] Latest code pulled from main branch

## Deployment Steps

### Step 1: Apply Database Migration
```bash
# Apply the idempotency migration
supabase db push

# Or manually run in Supabase SQL editor:
# psql -d [your_db] -f supabase/migrations/20260205_improve_match_idempotency.sql
```

**What it does:**
- Adds `idempotency_key` column to track requests
- Creates helper function for safe inserts
- Adds index for faster lookups

**Verification:**
```sql
-- Check if migration was applied
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'user_matches' AND column_name = 'idempotency_key';

-- Should return 1
```

### Step 2: Deploy Code Changes
```bash
# Commit the code changes
git add utils/strategies/FreeMatchingStrategy.ts
git commit -m "Fix free signup duplicate match constraint violations

- Add pre-insert duplicate check to prevent unique constraint violations
- Improve error handling for concurrent/retry requests
- Make free signup idempotent
- Treat duplicate match attempts as success (idempotent)

Fixes: duplicate key value violates unique constraint 'user_matches_unique'"

# Push to production
git push
```

**What changed:**
- `utils/strategies/FreeMatchingStrategy.ts`: Lines 472-608
  - Added duplicate checking before insert (lines 492-555)
  - Improved error handling (lines 557-608)

### Step 3: Monitor After Deployment

#### In Sentry
- Look for these logs to verify fix is working:
  - "Checking for existing matches before insert"
  - "All matches already exist (idempotent request)" ← Good sign!
  - Should NOT see: `duplicate key value violates unique constraint "user_matches_unique"`

#### In Console Logs
```
[MATCHING_FREE] Checking for existing matches before insert
[MATCHING_FREE] Filtered duplicate matches: original=5, existing=5, new=0
[MATCHING_FREE] All matches already exist (idempotent request)
```

#### User Signup Success Rate
- Monitor `/api/signup/free` error rate
- Should drop significantly (approaching 0% for duplicate attempts)
- Success rate should increase

### Step 4: Rollback (if needed)
```bash
# Revert code changes
git revert [commit_hash]

# Revert migration (if needed)
# Note: Migration is safe to keep (just adds column)
# But can be rolled back by dropping the column:
# ALTER TABLE user_matches DROP COLUMN idempotency_key;
```

## Validation Checklist

### Unit Testing
- [ ] Verify `FreeMatchingStrategy.ts` has no linter errors
- [ ] Verify all imports are correct
- [ ] Verify error handling paths work

### Integration Testing (Manual)
- [ ] Create test account → signup should work
- [ ] Try signing up same email again → should get 409 (expected)
- [ ] Simulate network retry → should be idempotent
- [ ] Check logs for "idempotent" messages

### Production Monitoring (First 24h)
- [ ] Check Sentry for new errors in signup flow
- [ ] Verify no unique constraint violations appear
- [ ] Monitor API response times (should be same or faster)
- [ ] Check user signup completion rate

## Expected Improvements

### Before Fix
- **Error**: `duplicate key value violates unique constraint "user_matches_unique"`
- **Impact**: Free signup fails intermittently
- **User Experience**: Confusing error messages, retry loops

### After Fix
- **Error**: Handled gracefully, idempotent retries work
- **Impact**: Free signup succeeds consistently
- **User Experience**: Smooth signup experience, no error spam

## Rollback Plan
If the fix causes issues:
1. Revert the code commit: `git revert [commit]`
2. Migration can stay (harmless - just adds column)
3. Redeploy to get back to previous version

## Communication

### To Share With Team
```
🔧 DEPLOYMENT: Free Signup Duplicate Match Fix

We've identified and fixed an issue where free signups were failing with 
"duplicate key value violates unique constraint" errors.

Root Cause: Concurrent/retry requests tried to insert the same matches twice.

Solution: 
- Added pre-insert duplicate checking
- Made signup idempotent (retries are now safe)
- Better error handling for concurrent requests

Status: Ready for production deployment
Urgency: High (blocks user signups)

Action: Deploy code + run migration
Monitoring: Watch Sentry for ~2 hours post-deploy
```

## Success Criteria
- [ ] No new unique constraint violation errors in Sentry
- [ ] Free signup success rate ≥ 95%
- [ ] Logs show idempotent handling on retries
- [ ] API response times normal (< 2s)
- [ ] Users complete signups without errors

## Further Optimization (Future)
- Use `idempotency_key` column for stronger guarantees
- Implement request-level deduplication cache
- Add monitoring dashboard for signup metrics
