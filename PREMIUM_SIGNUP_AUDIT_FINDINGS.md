# Premium Signup Flow - Comprehensive Audit Findings

**Date**: January 28, 2026  
**Status**: 🔴 **CRITICAL ISSUES FOUND** - Premium signup has 4 blocking bugs similar to free flow

---

## Executive Summary

Premium signup (`/api/signup/route.ts`) has **CRITICAL DATABASE SCHEMA MISMATCHES** identical to the free flow issues already fixed. The premium route references non-existent tables:
- ❌ `matches` table (doesn't exist - should use `user_matches`)
- ❌ `promo_pending` table (doesn't exist)
- ❌ `user_email` field (doesn't exist in `user_matches` - should use `user_id`)

**Status**: Premium signup is **COMPLETELY BROKEN** for:
- ✗ Detecting existing matches
- ✗ Idempotent signup (re-signup protection)
- ✗ Promo code feature
- ✗ Match count reporting

---

## 🔴 CRITICAL BUG #P1: Non-existent "matches" Table

**File**: `/api/signup/route.ts`  
**Lines**: 127-130, 477-491  
**Severity**: CRITICAL - Blocks core signup flow

### Problem
Premium signup checks for existing matches using non-existent table:

```typescript
// Line 127-130 - WILL FAIL
const { data: existingMatches } = await supabase
  .from("matches")              // ← Table doesn't exist
  .select("job_hash")
  .eq("user_email", normalizedEmail)  // ← Field doesn't exist
  .limit(1);
```

### Database Reality
- **Actual table**: `user_matches` (with columns: `id`, `user_id`, `job_id`, `match_score`, etc.)
- **No `user_email` field**: Uses `user_id` (UUID foreign key to `users.id`)
- **No `job_hash` field**: Uses `job_id` (UUID foreign key to `jobs.id`)

### Impact
1. **Line 127-130**: Query fails silently → `existingMatches` is always `null`
2. **Line 461**: Condition `if (existingMatches && existingMatches.length > 0)` never true
3. **Line 477-491**: Match count query also fails
4. Premium users lose re-signup protection
5. Duplicate signup detection broken

---

## 🔴 CRITICAL BUG #P2: Email-Based Match Queries

**File**: `/api/signup/route.ts`  
**Lines**: 129, 479-489  
**Severity**: CRITICAL - Cannot fetch matches

### Problem
Queries use email as primary key, but `user_matches` uses `user_id`:

```typescript
// Line 479 - WRONG APPROACH
.eq("user_email", normalizedEmail)  // ← user_email doesn't exist

// Line 488-489 - SAME ISSUE
.select("job_hash, match_score, match_reason")
.eq("user_email", normalizedEmail)
```

### Required Fix
1. First lookup `user_id` from `users` table by email
2. Then query `user_matches` with `user_id`
3. Join to `jobs` via `job_id`

### Impact
- Cannot retrieve existing matches
- Cannot get match count
- Cannot send match email on idempotent signup
- Premium welcome email will have 0 matches

---

## 🔴 CRITICAL BUG #P3: Non-existent "promo_pending" Table

**File**: `/api/signup/route.ts`  
**Lines**: 214-221  
**Severity**: HIGH - Promo code feature broken

### Problem
Premium signup attempts to validate promo codes from non-existent table:

```typescript
// Line 214-218 - WILL FAIL
const { data: pendingPromo } = await supabase
  .from("promo_pending")        // ← Table doesn't exist
  .select("promo_code, expires_at")
  .eq("email", normalizedEmail)
  .single();
```

### Impact
1. Promo code feature completely non-functional
2. `hasValidPromo` is always `false`
3. No 1-month free premium for promo users
4. Promo users charged immediately instead of getting free trial

### Code Path
- Line 220-221: Checks if promo is valid
- Line 232: Sets `subscriptionActive = false` (never true)
- Line 236: `finalSubscriptionTier` stays `"premium_pending"`
- Line 229: `emailVerified = false` (stays unverified)
- Result: User never gets premium access, stuck in verification

---

## ⚠️ ARCHITECTURAL ISSUE #P4: Inconsistent Email vs ID Querying

**File**: `/api/signup/route.ts`  
**Locations**: Lines 117-130, 476-491

### Issue
All user lookups use `email` as query key, but `user_matches` uses `user_id`.

**This creates a pattern error** throughout the file:
```typescript
// Anti-pattern currently in code:
const normalizedEmail = data.email.toLowerCase().trim();
const { data: existingUser } = await supabase
  .from("users")
  .select("id, email, ...")
  .eq("email", normalizedEmail)  // ✓ Correct
  .single();

// Then later:
const { data: existingMatches } = await supabase
  .from("matches")
  .select("job_hash")
  .eq("user_email", normalizedEmail)  // ✗ Wrong - should query by user_id
```

### Fix Pattern
```typescript
// After getting user
if (existingUser?.id) {
  const { data: existingMatches } = await supabase
    .from("user_matches")
    .select("job_id")
    .eq("user_id", existingUser.id)  // ✓ Use user_id
    .limit(1);
}
```

---

## Database Schema Verification

### What Premium Signup Expects
- ❌ `matches` table with `user_email` and `job_hash` columns
- ❌ `promo_pending` table with `promo_code` and `expires_at` columns

### What Actually Exists in Database
- ✓ `user_matches` table with `user_id` (FK), `job_id` (FK), `match_score`, `match_reason`, etc.
- ✓ `users` table with `id`, `email`, `promo_code_used`, `promo_expires_at` fields
- ✗ NO `promo_pending` table (promo validation must be different)

---

## Impact Matrix

| Feature | Status | Root Cause | Consequence |
|---------|--------|-----------|-------------|
| Duplicate signup detection | ✗ BROKEN | Bug #P1 | Can signup multiple times with same email |
| Existing match retrieval | ✗ BROKEN | Bug #P2 | Match count always 0 |
| Idempotent signup | ✗ BROKEN | Bug #P1 | Duplicate accounts on retry |
| Promo code activation | ✗ BROKEN | Bug #P3 | Free trial feature non-functional |
| Welcome email with matches | ✗ BROKEN | Bug #P2 | Sends email with 0 jobs |
| Re-signup on existing account | ✗ BROKEN | Bug #P1 | No redirect to existing matches |

---

## Comparison with Free Signup (Already Fixed)

| Bug | Free Signup | Premium Signup | Status |
|-----|------------|---------------|--------|
| uses `matches` table | ✓ FIXED | 🔴 SAME BUG | Same root cause |
| uses `user_email` query | ✓ FIXED | 🔴 SAME BUG | Same root cause |
| uses `user_id` for filtering | ✓ FIXED | ❌ NOT USING | Different yet |
| Response missing email | ✓ FIXED | TBD | Not tested |
| Cookie name mismatch | ✓ FIXED | Uses `user_email` ✓ | Correct in premium |

---

## Testing Status

### Current Premium Tests
- ❌ No E2E tests for premium signup found
- ❌ No unit tests for premium signup found
- ❌ Premium flow untested against production database schema

### Actual Behavior if Executed
1. User fills premium signup form
2. POST `/api/signup/route.ts` called
3. Rate limit check: ✓ PASS
4. Validation: ✓ PASS
5. **Line 127-130**: Query `matches` table → ✗ FAILS (table doesn't exist)
6. Query returns empty/null
7. **Line 461**: Condition false → Goes to new user flow
8. User created ✓
9. **Line 215-218**: Query `promo_pending` → ✗ FAILS (table doesn't exist)
10. Promo code never activates
11. User stuck in `premium_pending` tier, never verified
12. User cannot access matches

---

## Required Fixes (In Order of Criticality)

### PRIORITY 1: Fix Bug #P1 - user_matches table (BLOCKING)
Replace all `matches` table queries with `user_matches`:

```typescript
// Lines 127-130 - Replace:
const { data: existingMatches } = await supabase
  .from("user_matches")
  .select("job_id")
  .eq("user_id", existingUser?.id)
  .limit(1);
```

### PRIORITY 2: Fix Bug #P2 - Email to ID conversion (BLOCKING)
Add user lookup before accessing matches:

```typescript
// After line 121, before line 126:
if (!existingUser?.id) {
  return NextResponse.json(
    { error: "User not found" },
    { status: 404 }
  );
}

const { data: existingMatches } = await supabase
  .from("user_matches")
  .select("job_id")
  .eq("user_id", existingUser.id)  // Use user_id
  .limit(1);
```

### PRIORITY 3: Fix Bug #P3 - Promo code validation
Determine correct promo code table/logic:
- Check if `users` table stores `promo_code_used` and `promo_expires_at`
- If so, remove `promo_pending` query entirely
- Validate promo code from different source (API, environment, etc.)

### PRIORITY 4: Update tests
- Create premium signup unit tests
- Create premium signup E2E tests
- Test promo code activation path
- Test duplicate signup detection

---

## Verification Checklist

- [ ] Confirm `user_matches` table structure
- [ ] Confirm `promo_pending` table location (or removal)
- [ ] Verify promo code storage location
- [ ] Fix Bug #P1 (user_matches queries)
- [ ] Fix Bug #P2 (user_id lookups)
- [ ] Fix Bug #P3 (promo validation)
- [ ] Create premium signup unit tests
- [ ] Create premium signup E2E tests
- [ ] Verify redirect behavior for existing users
- [ ] Verify email verification flow
- [ ] Verify match count accuracy
- [ ] Run full premium signup flow end-to-end

---

## Files Affected

- `/app/api/signup/route.ts` - PRIMARY (4 bugs)
- `/components/signup/SignupForm.tsx` - Form component (needs testing)
- `/tests/e2e/premium-signup.spec.ts` - Should exist but doesn't
- `/__tests__/api/signup.test.ts` - Should exist but doesn't

---

## Recommendation

**DO NOT DEPLOY** premium signup until:
1. ✓ Bug #P1 fixed (user_matches queries)
2. ✓ Bug #P2 fixed (user_id lookups)
3. ✓ Bug #P3 fixed (promo code logic)
4. ✓ Premium signup tests created and passing
5. ✓ End-to-end flow verified against production database

**Timeline**: Similar to free signup fixes - approximately 2-3 hours for full audit + implementation + testing

