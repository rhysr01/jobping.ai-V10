# Free Signup Bug - Investigation & Fix Checklist

## 📋 Investigation Checklist

### Step 1: Access Error Data (TODAY)
- [ ] Go to https://sentry.io
- [ ] Select JobPing project
- [ ] Filter by `endpoint:signup-free`
- [ ] Sort by "Most Frequent"
- [ ] Note the top 3 error types
- [ ] Check error frequency (1/day? 10/hour? 100/hour?)
- [ ] Record the most common error_type:
  ```
  Most common error: _________________________
  Frequency: _____ per hour
  ```

### Step 2: Check Job Database (TODAY)
- [ ] Connect to Supabase
- [ ] Run query: `SELECT DISTINCT city FROM jobs LIMIT 20;`
- [ ] Check format of city names:
  - [ ] Are they "london" or "London" or "london, uk"?
  - [ ] Are they consistent?
  - [ ] Record format: _________________________
- [ ] Run query: `SELECT DISTINCT categories FROM jobs WHERE categories IS NOT NULL LIMIT 20;`
- [ ] Check job categories format:
  - [ ] Are they "backend-engineer" or "backend engineer"?
  - [ ] What categories are most common?
  - [ ] Record examples: _________________________

### Step 3: Check Career Path Mapping (TODAY)
- [ ] Open: `utils/matching/categoryMapper.ts`
- [ ] Find: `FORM_TO_DATABASE_MAPPING`
- [ ] Check which form options are NOT mapped:
  ```
  Missing mappings:
  1. ________________________
  2. ________________________
  3. ________________________
  ```
- [ ] Check which jobs have these categories:
  ```sql
  SELECT DISTINCT categories FROM jobs 
  WHERE categories LIKE '%<unmapped_category>%' 
  LIMIT 5;
  ```

### Step 4: Local Testing (TODAY-TOMORROW)
- [ ] Start dev server: `SENTRY_DEBUG=true npm run dev`
- [ ] Open browser DevTools (F12)
- [ ] Submit signup form with:
  - [ ] Test 1: London, Software Engineer, EU
  - [ ] Test 2: Paris, Product Manager, EU
  - [ ] Test 3: Berlin, Data Scientist, Non-EU
- [ ] Watch browser console for:
  - [ ] `[FREE SIGNUP] Pre-filtered jobs: original: X, afterPreFilter: Y`
  - [ ] If Y=0, city/career filter is too strict
  - [ ] Note results: ________________________
- [ ] Check server logs for:
  - [ ] `Career mapping:` logs (shows mapping)
  - [ ] If shows raw value (no mapping), that's issue
  - [ ] Note results: ________________________

### Step 5: Run Diagnostic (TODAY)
- [ ] Run: `npm run test:sentry`
- [ ] Verify Sentry DSN is set: ✓ / ✗
- [ ] Check if test events appear in Sentry: ✓ / ✗
- [ ] If not, fix environment variables

### Step 6: Analyze Error Patterns (TOMORROW)
Based on Sentry data, identify which scenario is most likely:
- [ ] **Scenario A - City Mismatch** (Most likely if: many "no_matches_found")
  - [ ] Evidence: ________________________
  - [ ] Fix Priority: 🔴 HIGH
  
- [ ] **Scenario B - Career Mapping** (Most likely if: many "no_jobs_after_filter")
  - [ ] Evidence: ________________________
  - [ ] Fix Priority: 🔴 HIGH
  
- [ ] **Scenario C - Visa Sponsorship** (Most likely if: many "no_matches_found" + Non-EU users)
  - [ ] Evidence: ________________________
  - [ ] Fix Priority: 🟡 MEDIUM

---

## 🛠️ Fix Checklist

### Fix #1: Improve City Matching (If applicable)
**File**: `utils/strategies/FreeMatchingStrategy.ts`  
**Line**: 68-70

- [ ] Create branch: `fix/free-signup-city-matching`
- [ ] Read current code (lines 67-100)
- [ ] Change city matching logic:
  - [ ] From: Exact match only (`===`)
  - [ ] To: Multiple strategies (startsWith, includes, etc.)
- [ ] Test locally with different city formats
- [ ] Run: `npm run test:production-engine`
- [ ] Verify no regressions
- [ ] Commit with message: "fix: improve city matching for free signup"

**Code Change Template**:
```typescript
// BEFORE
const cityMatch = userPrefs.target_cities.some(
  (city) => job.city?.toLowerCase() === city.toLowerCase()
);

// AFTER
const cityMatch = userPrefs.target_cities.some((city) => {
  const jobCityLower = job.city?.toLowerCase() || "";
  const jobLocationLower = job.location?.toLowerCase() || "";
  const cityLower = city.toLowerCase();
  
  // Exact match
  if (jobCityLower === cityLower) return true;
  
  // Starts with (handles "london, uk")
  if (jobCityLower.startsWith(cityLower)) return true;
  if (jobLocationLower.startsWith(cityLower)) return true;
  
  // Contains (handles "Greater London")
  if (jobCityLower.includes(cityLower)) return true;
  if (jobLocationLower.includes(cityLower)) return true;
  
  return false;
});
```

### Fix #2: Verify Career Path Mapping (If applicable)
**File**: `utils/matching/categoryMapper.ts`

- [ ] Create branch: `fix/free-signup-career-mapping`
- [ ] Review FORM_TO_DATABASE_MAPPING
- [ ] Add logging to detect missing mappings:
  ```typescript
  const dbCategory = FORM_TO_DATABASE_MAPPING[userCareer] || userCareer;
  if (!FORM_TO_DATABASE_MAPPING[userCareer]) {
    console.warn(`[CAREER MAPPING] No mapping for: "${userCareer}"`);
  }
  ```
- [ ] Test signup and check console for warnings
- [ ] For each warning, add proper mapping:
  ```typescript
  FORM_TO_DATABASE_MAPPING: {
    // ... existing mappings ...
    "Senior Manager": "management-executive",  // Add missing
  }
  ```
- [ ] Verify job database has these categories:
  ```sql
  SELECT DISTINCT categories FROM jobs LIMIT 100;
  ```
- [ ] Update FORM_TO_DATABASE_MAPPING based on actual categories
- [ ] Test locally
- [ ] Commit with message: "fix: complete career path mapping for free signup"

### Fix #3: Relax Visa Sponsorship Filtering (If applicable)
**File**: `utils/matching/core/prefilter.service.ts`

- [ ] Create branch: `fix/free-signup-visa-filtering`
- [ ] Find: `filterByVisa()` method (around line ~250-320)
- [ ] Review current logic
- [ ] Change logic to be more lenient:
  ```typescript
  private filterByVisa(jobs, user) {
    if (user.visa_status === "need-sponsorship") {
      // For non-EU users: DON'T filter aggressively
      // Assume jobs can sponsor if flag missing
      return jobs.filter(j => 
        j.visa_sponsorship !== false  // Allow null/true/missing
      );
    }
    // For EU citizens, allow all EU jobs
    return jobs;
  }
  ```
- [ ] Test with both EU and Non-EU users
- [ ] Verify match count increases for Non-EU users
- [ ] Commit with message: "fix: relax visa sponsorship filtering for free signup"

---

## ✅ Testing After Fixes

### Unit Tests
- [ ] Run: `npm run test:production-engine`
- [ ] All tests pass: ✓ / ✗
- [ ] Check test coverage for free signup: ____%

### Integration Tests
- [ ] Run: `npm run test:e2e`
- [ ] Free signup flow passes: ✓ / ✗

### Manual Testing Checklist
For each test case, fill in results:

**Test Case 1: Valid EU User**
```
Cities: [London, Manchester, Birmingham]
Career: Software Engineer
Visa: EU citizen

Expected: 5 matches
Actual: _____ matches
Status: ✓ PASS / ✗ FAIL
```

**Test Case 2: Valid Non-EU User**
```
Cities: [Berlin, Hamburg]
Career: Backend Developer
Visa: Non-EU (require sponsorship)

Expected: 5 matches
Actual: _____ matches
Status: ✓ PASS / ✗ FAIL
```

**Test Case 3: Multiple Cities**
```
Cities: [Paris, Amsterdam, Brussels]
Career: Product Manager
Visa: EU citizen

Expected: 5 matches
Actual: _____ matches
Status: ✓ PASS / ✗ FAIL
```

**Test Case 4: Rare Career Path**
```
Cities: [Stockholm]
Career: [Unmapped career]
Visa: EU citizen

Expected: Should handle gracefully
Actual: _____ matches / Error: _______
Status: ✓ PASS / ✗ FAIL
```

### Sentry Monitoring After Deployment
- [ ] Deploy to staging
- [ ] Wait 24 hours
- [ ] Check Sentry for error frequency:
  - [ ] "no_matches_found" count decreased: ✓ / ✗
  - [ ] "no_jobs_after_filter" count decreased: ✓ / ✗
  - [ ] No new errors introduced: ✓ / ✗
- [ ] If all ✓, deploy to production
- [ ] Monitor for 48 hours
- [ ] Verify improvement in production Sentry

---

## 📊 Success Metrics

After fixes are deployed, measure:

**Before Fixes**:
- Error rate: __________ errors/hour
- "no_matches_found": __________ % of signups
- "no_jobs_after_filter": __________ % of signups
- Free signup completion rate: __________ %

**After Fixes (Target)**:
- Error rate: < 5% of signups
- "no_matches_found": < 10% of signups
- "no_jobs_after_filter": < 5% of signups
- Free signup completion rate: > 80%

---

## 📝 Documentation Updates

After fixes are complete:

- [ ] Update this checklist with final status
- [ ] Document the actual root cause found
- [ ] Update FreeMatchingStrategy.ts comments
- [ ] Update FORM_TO_DATABASE_MAPPING with all mappings
- [ ] Add test cases to prevent regression
- [ ] Update error handling documentation
- [ ] Create PR with clear description
- [ ] Tag PR with `bug-fix`, `free-signup`, `high-priority`

---

## 🚨 Escalation Path

If you get stuck:

1. **Cannot find error in Sentry**
   - [ ] Run: `npm run test:sentry`
   - [ ] Check SENTRY_DSN in .env.local
   - [ ] Verify Sentry project settings
   - [ ] Contact DevOps/Support

2. **Error type unclear**
   - [ ] Enable SENTRY_DEBUG=true
   - [ ] Run local test
   - [ ] Check console logs for detailed info
   - [ ] Ask in engineering channel

3. **Fix creates regressions**
   - [ ] Run full test suite: `npm run test`
   - [ ] Check Playwright E2E tests
   - [ ] Revert change and try different approach
   - [ ] Ask for code review

---

## ✨ Final Checklist

- [ ] All investigation steps completed
- [ ] Root cause identified
- [ ] Fix(es) implemented and tested
- [ ] Sentry shows improvement
- [ ] Documentation updated
- [ ] PR created and merged
- [ ] Monitoring in place for regression
- [ ] Team notified of fix

---

**Investigation Started**: January 27, 2026  
**Status**: 🔄 IN PROGRESS  
**Last Updated**: __________  
**Completed By**: __________

