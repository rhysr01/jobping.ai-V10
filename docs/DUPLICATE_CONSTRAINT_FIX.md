# Free Signup - Duplicate Match Constraint Violation Fix

## Issue
**Error:** `Failed to save matches: duplicate key value violates unique constraint "user_matches_unique"`

**Symptom:** Free signup appears to complete successfully ("Free signup completed successfully" log), but the database insert fails with a unique constraint violation, preventing users from getting matches.

## Root Cause
The `user_matches` table has a unique constraint `UNIQUE (user_id, job_id)` to ensure each user only has one match per job. When duplicate/retry requests come in (either from user clicking twice, network retries, or concurrent requests), both requests try to insert the same (user_id, job_id) pairs, violating this constraint.

The issue occurs because:
1. First request: User created → Matches inserted successfully
2. Retry/concurrent request: User already exists (exits early check) → **Tries to insert same matches again** → UNIQUE constraint violation

## Solution - Multi-layered Approach

### Layer 1: Idempotency Check (SignupMatchingService) ✅
- Already implemented at lines 114-135 of `SignupMatchingService.ts`
- Checks if user already has matches before attempting to create new ones
- Returns early if matches already exist
- **Issue**: This check happens at the service level, but doesn't prevent concurrent requests from both trying to insert

### Layer 2: Pre-Insert Duplicate Check (NEW) ✅
Added at lines 492-555 in `FreeMatchingStrategy.ts`:
```typescript
// Check if matches already exist for this user before inserting
const { data: existingMatches } = await supabase
  .from("user_matches")
  .select("job_id")
  .eq("user_id", userId)
  .in("job_id", jobIdsToCheck);

// Filter out matches that already exist
// Only insert new matches that don't already exist
matchesToSave = newMatches;
```

This prevents the unique constraint violation by:
- Checking which matches already exist in the database
- Only attempting to insert NEW matches
- If all matches already exist, returns success (idempotent)

### Layer 3: Unique Constraint Error Handling (IMPROVED) ✅
Added at lines 557-608 in `FreeMatchingStrategy.ts`:
- Catches unique constraint errors specifically
- Treats them as idempotent successes (matches already saved)
- Only retries foreign key errors (which are transient)
- Provides clear error messages for actual failures

### Layer 4: Database-level Idempotency (NEW) 
Migration: `20260205_improve_match_idempotency.sql`
- Creates idempotency_key column for future use
- Adds index on idempotency_key for faster lookups
- Provides helper function for safe idempotent inserts
- **Not yet active** - prepared for future enhancement

## Changes Made

### 1. Updated FreeMatchingStrategy.ts
```
Lines 472-555: Added pre-insert duplicate check
Lines 557-608: Improved error handling for unique constraints
```

**Key improvements:**
- Checks for existing matches before insert
- Filters out duplicates
- Handles idempotent retries gracefully
- Better error classification (FK vs unique constraint)

### 2. Created Migration 20260205
- Adds `idempotency_key` column to `user_matches`
- Creates helper function for safe inserts
- Indexes for performance

## Testing

### To verify the fix:
1. Run migration: `20260205_improve_match_idempotency.sql`
2. Test free signup flow
3. Simulate retries (click button twice, network failures)
4. Verify logs show:
   - "Checking for existing matches before insert"
   - "All matches already exist (idempotent request)" on retries
   - No unique constraint violations in Sentry

### Expected behavior:
- **First request**: Creates matches, returns success
- **Retry/concurrent request**: Detects existing matches, returns success (idempotent)
- **No database errors**: Unique constraint handled gracefully

## Logging
The fix adds comprehensive logging at key points:
```
[MATCHING_FREE] Checking for existing matches before insert
[MATCHING_FREE] Filtered duplicate matches: original=5, existing=5, new=0
[MATCHING_FREE] All matches already exist (idempotent request)
```

## Performance Impact
- **Minimal**: One additional query to check for existing matches (~2ms on indexed column)
- **Benefit**: Prevents failed signups and improves user experience

## Related Issues
- Foreign key constraints: Fixed by migration `20260204_fix_user_matches_foreign_key.sql`
- Null job hashes: Fixed by migration `20260204_fix_missing_job_hashes.sql`
- This fix: Handles concurrent/retry requests with proper idempotency
