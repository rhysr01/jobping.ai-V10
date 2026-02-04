# Error Fix Plan - Sentry Errors Analysis & Resolution

**Date:** February 4, 2026  
**Total Errors:** 18 errors in last 24 hours  
**Priority:** High - Multiple critical issues affecting user experience

---

## 📊 Error Summary

- **ERROR Level:** 7 issues, 31M+ occurrences
- **WARNING Level:** 6 issues, 657K+ occurrences  
- **INFO Level:** 5 issues, 22K+ occurrences

---

## 🔴 Priority 1: Critical Database Issues

### Issue 1.1: Foreign Key Constraint Violations (5 occurrences)
**Error:** `user_matches_user_id_fkey` constraint violations  
**Impact:** Users can sign up but matches fail to save  
**Root Cause:** Race condition - matches saved before user record committed, or migration not applied

**Fix Plan:**
1. ✅ Verify migration `20260204_fix_user_matches_foreign_key.sql` is applied
2. ✅ Add transaction wrapper to ensure user creation completes before match saving
3. ✅ Add retry logic with exponential backoff for FK constraint errors
4. ✅ Improve error handling to check user exists before saving matches
5. ✅ Add database-level check constraint validation

**Files to Modify:**
- `utils/strategies/FreeMatchingStrategy.ts` (lines 367-490)
- `utils/strategies/PremiumMatchingStrategy.ts` (lines 248-452)
- `app/api/signup/free/route.ts` (user creation flow)

**Implementation Steps:**
```typescript
// 1. Wrap user creation + match saving in transaction
// 2. Add explicit user verification before match insert
// 3. Add retry logic for FK errors
// 4. Improve error messages with user context
```

---

### Issue 1.2: No Jobs Found for Hashes (1 occurrence)
**Error:** `No jobs found for hashes: null, null, null, null, null`  
**Impact:** Users get no matches even when jobs exist  
**Root Cause:** Job hash lookup failing or null hashes being passed

**Fix Plan:**
1. ✅ Add validation to ensure job_hashes are not null before lookup
2. ✅ Add fallback to job ID lookup if hash lookup fails
3. ✅ Improve error logging with job hash values
4. ✅ Add monitoring for job hash generation failures

**Files to Modify:**
- `utils/strategies/FreeMatchingStrategy.ts` (lines 442-455)

---

## 🟡 Priority 2: Configuration & Environment Issues

### Issue 2.1: OpenAI API Key Not Configured (14 occurrences)
**Error:** Multiple variations of "OpenAI API key not configured"  
**Impact:** AI matching unavailable, falls back to rule-based  
**Root Cause:** OPENAI_API_KEY not set in Vercel or optional validation causing warnings

**Fix Plan:**
1. ✅ Set OPENAI_API_KEY in Vercel environment variables
2. ✅ Change Sentry logging from WARNING to INFO for expected fallback behavior
3. ✅ Only log to Sentry if AI matching is explicitly requested but unavailable
4. ✅ Add environment variable validation check on startup

**Files to Modify:**
- `utils/matching/core/ai-matching.service.ts` (lines 75-160)
- `lib/env.ts` (make OPENAI_API_KEY truly optional)
- Remove Sentry warnings for expected fallback behavior

**Implementation:**
```typescript
// Change from Sentry.captureMessage(..., level: "warning")
// To: console.warn() or Sentry.captureMessage(..., level: "info")
// Only log if user explicitly requested AI matching
```

---

## 🟢 Priority 3: Validation & User Experience

### Issue 3.1: Free Signup Validation Failed (8 occurrences)
**Error:** "Name contains invalid characters", validation failures  
**Impact:** Users can't complete signup  
**Root Cause:** Strict validation regex or edge cases not handled

**Fix Plan:**
1. ✅ Review and improve name validation regex
2. ✅ Add better error messages for users
3. ✅ Add client-side validation hints
4. ✅ Handle edge cases (special characters, unicode, etc.)

**Files to Modify:**
- `app/api/signup/free/route.ts` (lines 28-54)
- `components/signup/SignupFormFree.tsx` (client-side validation)

**Current Regex:** `/^[\p{L}\s'.-]+$/u`  
**Consider:** Allow more characters or provide clearer error messages

---

### Issue 3.2: Rate Limit Exceeded (9 occurrences)
**Error:** "Rate limit exceeded for free signup"  
**Impact:** Legitimate users may be blocked  
**Status:** ✅ **EXPECTED BEHAVIOR** - This is working as designed

**Fix Plan:**
1. ✅ Change Sentry level from WARNING to INFO
2. ✅ Don't log rate limit errors to Sentry (expected behavior)
3. ✅ Improve user-facing error message
4. ✅ Add rate limit status to response headers

**Files to Modify:**
- Rate limiting middleware
- Remove Sentry logging for rate limit errors

---

## 🔵 Priority 4: Frontend Issues

### Issue 4.1: React Hooks Error (3 occurrences)
**Error:** "Rendered fewer hooks than expected"  
**Impact:** Component rendering issues, potential UI bugs  
**Root Cause:** Conditional hook usage or early return before hooks

**Fix Plan:**
1. ✅ Find component causing the error (check Sentry stack traces)
2. ✅ Fix conditional hook usage
3. ✅ Ensure all hooks are called unconditionally
4. ✅ Add React hooks linting rules

**Files to Investigate:**
- Check Sentry error details for component name
- Review all components with conditional logic before hooks
- Add `eslint-plugin-react-hooks` if not present

---

### Issue 4.2: Account Already Exists (1 occurrence)
**Error:** `ApiError: account_already_exists`  
**Impact:** User tries to sign up but account exists  
**Status:** ✅ **EXPECTED BEHAVIOR** - User should be redirected to login

**Fix Plan:**
1. ✅ Improve error handling to redirect to login
2. ✅ Change Sentry level to INFO (not an error)
3. ✅ Add user-friendly message

---

## 📋 Implementation Checklist

### Phase 1: Critical Fixes (Week 1)
- [ ] Fix foreign key constraint violations
  - [ ] Verify migration applied
  - [ ] Add transaction wrapper
  - [ ] Add retry logic
  - [ ] Test user creation + match saving flow
- [ ] Fix OpenAI API key warnings
  - [ ] Set OPENAI_API_KEY in Vercel
  - [ ] Change Sentry level to INFO
  - [ ] Remove unnecessary warnings
- [ ] Fix "No jobs found" error
  - [ ] Add null hash validation
  - [ ] Add fallback lookup

### Phase 2: Validation & UX (Week 1-2)
- [ ] Improve name validation
  - [ ] Review regex patterns
  - [ ] Add better error messages
  - [ ] Test edge cases
- [ ] Fix rate limit logging
  - [ ] Change to INFO level
  - [ ] Remove from Sentry warnings

### Phase 3: Frontend Fixes (Week 2)
- [ ] Fix React hooks error
  - [ ] Identify component
  - [ ] Fix conditional hooks
  - [ ] Add linting rules
- [ ] Improve account exists handling
  - [ ] Add redirect logic
  - [ ] Improve UX

### Phase 4: Monitoring & Prevention (Week 2-3)
- [ ] Add error monitoring dashboard
- [ ] Set up alerts for critical errors
- [ ] Add integration tests for error scenarios
- [ ] Document error handling patterns

---

## 🧪 Testing Strategy

1. **Unit Tests:**
   - Test user creation + match saving transaction
   - Test FK constraint error handling
   - Test validation edge cases

2. **Integration Tests:**
   - Test full signup flow
   - Test match saving with various scenarios
   - Test rate limiting behavior

3. **E2E Tests:**
   - Test signup with edge case names
   - Test signup when account exists
   - Test rate limit exceeded flow

---

## 📈 Success Metrics

- **Target:** Reduce ERROR level occurrences by 90%
- **Target:** Reduce WARNING level occurrences by 80%
- **Target:** Zero foreign key constraint violations
- **Target:** Zero "No jobs found" errors
- **Target:** Improved user signup success rate

---

## 🔍 Monitoring

After fixes are deployed:
1. Monitor Sentry for 48 hours
2. Check error rate reduction
3. Verify no new error patterns
4. Confirm user signup success rate improved

---

## 📝 Notes

- Rate limit errors are **expected behavior** - should not be logged as warnings
- OpenAI API key warnings are **expected fallback** - should be INFO level
- Foreign key violations are **critical** - need immediate fix
- React hooks error needs **investigation** - check Sentry for component details

---

**Next Steps:**
1. Review and approve this plan
2. Start with Priority 1 fixes
3. Deploy incrementally with monitoring
4. Update plan based on results
