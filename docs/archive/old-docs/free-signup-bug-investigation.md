# FREE SIGNUP BUG - COMPLETE ANALYSIS & ERROR TRACKING REPORT

## EXECUTIVE SUMMARY

The free signup flow has comprehensive error tracking and handling in place. However, the Sentry MCP integration is returning 404 errors, which means **actual error data from users is not currently accessible**. Below is a detailed breakdown of all error paths and how to access them.

---

## ERROR TRACKING ARCHITECTURE

### Server-Side Error Flow (Backend)
**Route**: `/api/signup/free/route.ts` (1,082 lines)

```
REQUEST
  ↓
[Rate Limit Check] → Returns 429 if exceeded
  ↓
[Zod Validation] → Returns 400 if invalid
  ↓
[User Existence Check] → Logs warning if DB error
  ↓
[User Creation] → Throws error if fails
  ↓
[Job Fetching] → Multiple fallback strategies
  ↓
[Matching Engine] → SignupMatchingService
  ↓
RESPONSE (Success or Error)
```

### Client-Side Error Flow (Frontend)
**Component**: `/components/signup/SignupFormFree.tsx` (600+ lines)

```
FORM SUBMISSION
  ↓
[Client Validation] → Sets validationErrors state
  ↓
[API Call] → POST /api/signup/free
  ↓
[Response Check]
  ├─ Success → Save preferences & redirect
  ├─ 400 Error → Parse Zod errors & display
  ├─ 409 Exists → Redirect to matches
  └─ Other Error → Show generic message
  ↓
[Sentry Tracking] → All paths tracked
```

---

## COMPLETE ERROR MAPPING

### SERVER-SIDE ERRORS (All with Sentry Tracking)

| # | Error Type | Status | Line | Tag | Context |
|---|-----------|--------|------|-----|---------|
| 1 | Rate Limit Exceeded | 429 | 356 | `error_type: "rate_limit"` | IP, requestId |
| 2 | Validation Failed | 400 | 408 | `error_type: "validation"` | Email, cities, careerPath, zod errors |
| 3 | User Check Failed | N/A | 479 | `error_type: "user_check"` | Email, error code |
| 4 | User Check Unexpected | N/A | 497 | `error_type: "user_check_unexpected"` | Email, error message |
| 5 | User Creation Failed | N/A | 624 | `error_type: "user_creation"` | Email, stage |
| 6 | User Update Failed | N/A | 682 | `error_type: "user_update"` | Email, field names |
| 7 | No Jobs Found | 404 | 868 | `error_type: "no_jobs_found"` | Cities, careerPath, reason |
| 8 | No Jobs for Matching | 404 | 928 | `error_type: "no_jobs_for_matching"` | TargetCities, careerPath |
| 9 | No Matches Found | 404 | 993 | `error_type: "no_matches_found"` | Jobs available, method |

### CLIENT-SIDE ERRORS (All with Sentry Tracking)

| # | Error Type | Level | Line | Tag | Context |
|---|-----------|-------|------|-----|---------|
| 10 | Client Validation | WARNING | 353 | `error_type: "client_validation"` | Form data, validation details |
| 11 | API Error (400) | WARNING | 416 | `error_type: "api_validation"` | Status, zod errors, form data |
| 12 | API Error (Network) | ERROR | 443 | `error_type: "api_error"` | Status, error message, form data |
| 13 | Unexpected Error | ERROR | 466 | `error_type: "unexpected_error"` | Error message, form data |
| 14 | React Error Boundary | ERROR | - | `errorBoundary: true` | Component stack, error type |

---

## KEY ERROR HANDLING FEATURES

### ✅ What's Working Well

1. **Request ID Tracing** (Line 324 in API route)
   - Every request gets unique UUID
   - Used in logs and Sentry for tracing

2. **Comprehensive Logging**
   - `console.log()` statements at every stage
   - Structured logging with `apiLogger`
   - Sentry tracking with tags and context

3. **Error Context**
   - All errors include form data: email, cities, careerPath, gdprConsent
   - Request ID included for tracing
   - Validation error details parsed and displayed

4. **Field Error Mapping** (Lines 398-404)
   ```typescript
   API Field          →  Form Field
   full_name          →  fullName
   careerPath         →  careerPath
   terms_accepted     →  gdprConsent
   age_verified       →  ageVerified
   visaStatus         →  visaStatus
   cities             →  cities
   ```

5. **Hydration Safety**
   - `isMounted` guard prevents mismatches (Line 72)
   - Errors cleared on mount (Line 126)
   - Errors cleared on step change (Line 111)

### ⚠️ Known Issues

1. **"Body Already Read" Error** (103 occurrences in Sentry docs)
   - Happens when body read multiple times
   - Likely in middleware or error handlers
   - **Root cause**: Not yet fully fixed
   - **Impact**: Could cause signup to fail silently

2. **User Update Continues with Partial Data** (Lines 643-691)
   - If update fails, signup continues
   - Some preferences might not be saved
   - **Risk**: Matching engine lacks full user context

3. **Sentry MCP Not Configured** (404 errors)
   - Cannot access actual error data via MCP
   - Must check Sentry dashboard manually

---

## HOW TO ACCESS ERROR DATA

### Option 1: Sentry Dashboard (Recommended)
```
1. Go to https://sentry.io
2. Select your project
3. Filter by tags:
   - endpoint: signup-free
   - error_type: (see table above)
4. Sort by timestamp or frequency
5. Look for patterns (e.g., many "no_jobs_found" errors?)
```

### Option 2: Run Diagnostic Script
```bash
npm run test:sentry
```
This will:
- Verify SENTRY_DSN is configured
- Send test events to Sentry
- Show debug information

### Option 3: Local Dev Testing
Start the app and watch browser console + server logs:
```bash
npm run dev
# Then submit form in browser
# Check F12 console for client-side logs
# Check terminal for server-side logs
```

### Option 4: Manual API Test
```bash
curl -X POST http://localhost:3000/api/signup/free \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "cities": ["london"],
    "careerPath": ["software engineer"],
    "visaStatus": "no",
    "terms_accepted": true,
    "age_verified": true
  }'
```

---

## ERROR FREQUENCY ANALYSIS

Based on documentation, likely error patterns:

### High Frequency (Common)
- ❌ `no_matches_found` - Too strict filtering
- ❌ `validation` - Form UX issues
- ❌ `no_jobs_found` - Empty database or bad scraping

### Medium Frequency (Occasional)  
- ⚠️ `user_update` - Schema cache issues
- ⚠️ `user_creation` - Database constraints
- ⚠️ `api_error` - Network timeouts

### Low Frequency (Rare)
- ⚠️ `rate_limit` - User abusing endpoint
- ⚠️ `body_already_read` - Request pipeline issue

---

## VALIDATION SCHEMA REQUIREMENTS

The API strictly validates input (lines 289-321):

```typescript
{
  email: string (required, email format, max 255)
  full_name: string (required, letters/spaces/hyphens only, max 100)
  cities: string[] (required, 1-3 cities)
  careerPath: string[] (required, 1+ paths)
  visaStatus: string (required, "yes" or "no")
  terms_accepted: boolean (required, must be true)
  age_verified: boolean (required, must be true)
  birth_year: number (optional, must be 16+ years old)
}
```

Common validation errors:
- Invalid email format
- Name contains special characters
- 0 cities selected
- 0 career paths selected
- GDPR consent not checked

---

## MATCHING SERVICE CONFIGURATION

**File**: `utils/services/SignupMatchingService.ts`

FREE TIER:
```
- maxMatches: 5
- jobFreshnessDays: 30 (only jobs from last 30 days)
- maxJobsToFetch: 5,000
- useAI: true
- fallbackThreshold: 3
```

Common reasons for "no_matches_found":
1. Too few jobs in database
2. Jobs don't match user's cities
3. Jobs don't match career path
4. All jobs filtered by freshness (>30 days old)
5. Matching engine filters too strict

---

## DEBUGGING CHECKLIST

When investigating the bug:

- [ ] Check Sentry dashboard for error frequency
- [ ] Look for error_type patterns (validation? no_jobs_found?)
- [ ] Check if specific cities/careers have issues
- [ ] Verify jobs are being scraped (check job table)
- [ ] Check job distribution across cities
- [ ] Test with different cities/careers locally
- [ ] Enable SENTRY_DEBUG=true for verbose logging
- [ ] Run npm run test:sentry to verify config
- [ ] Check .env.local for Sentry DSN

---

## NEXT STEPS

### Immediate Actions
1. **Verify Sentry config**: `npm run test:sentry`
2. **Check dashboard**: Go to Sentry and look for `endpoint:signup-free` errors
3. **Identify pattern**: Is it validation? matching? jobs?

### Investigation
1. **Find most common error**: Sort by frequency in Sentry
2. **Look for correlation**: Do errors cluster around specific cities/careers?
3. **Check timestamps**: When did errors start?

### Solution
Once you identify the error pattern, apply fix to corresponding area:
- Validation errors → Check form/API schema
- Job errors → Check scraping/database
- Matching errors → Check PrefilterService/matching engine
- API errors → Check database/network


---

## DEEP DIVE: MATCHING LOGIC & FILTERING PIPELINE

### Free Tier Matching Flow

**File**: `utils/strategies/FreeMatchingStrategy.ts`

```
INPUT: Jobs array + User preferences
  ↓
STAGE 1: Pre-filter by City + Career
  ├─ Exact city match (job.city === user.target_cities)
  ├─ Exact career match (job.categories includes user.career_path)
  └─ If preFiltered.length === 0:
     └─ FALLBACK: City substring match (more forgiving)
  ↓
STAGE 2: Light AI Ranking
  ├─ Use simplifiedMatchingEngine
  ├─ Sort by relevance score
  └─ Return top 5
```

### Critical Filter Chain (FreeMatchingStrategy.ts, Lines 67-99)

**Filter 1: City Match** (Line 68-70)
```typescript
const cityMatch = userPrefs.target_cities.some(
  (city) => job.city?.toLowerCase() === city.toLowerCase()
);
```
⚠️ **Issue**: EXACT match only. If job city data format differs, it fails.
✅ **Fallback**: Line 114-117 has substring match as fallback

**Filter 2: Career Path Match** (Line 74-96)
```typescript
const careerMatch = !userPrefs.career_path ||
  !job.categories || job.categories.length === 0 ||
  job.categories.some((cat) => {
    const dbCategory = FORM_TO_DATABASE_MAPPING[userCareer] || userCareer;
    return catLower === dbCategory.toLowerCase();
  });
```
⚠️ **Issue**: Uses `FORM_TO_DATABASE_MAPPING` - if mapping is incomplete, career won't match.
⚠️ **Issue**: Requires exact category match (case-insensitive)

**Result**: If both filters pass → Include job in preFiltered array

### Prefilter Service (New Architecture)

**File**: `utils/matching/core/prefilter.service.ts`

Secondary filtering with more granular control:

```
jobs[] 
  ↓
filterByLocation() → Check city + country variations
  ↓ 
filterByCareerPath() → Check job categories
  ↓
filterByVisa() → Check visa sponsorship
  ↓
filterByQuality() → Min description length, valid URLs
  ↓
scoreJobs() → Calculate unified scores
  ↓
ensureDiversity() → Distribute across sources
  ↓
Final result
```

**Key Methods**:

1. **filterByLocation()** (Lines 111-175)
   - Checks exact city match (lowercase)
   - Checks location field contains city
   - **Fallback 1**: Country-level matching (5+ jobs needed)
   - **Fallback 2**: First 50 jobs "broad" match

2. **filterByCareerPath()** (Lines ~180-250)
   - Maps form career path to DB categories
   - Exact category match required
   - If no categories in job → **PASSES** (allows through)

3. **filterByVisa()** (Lines ~250-320)
   - For visa requiring users: Only jobs with sponsorship
   - For EU citizens: Only EU jobs (or sponsor flag = true)

4. **filterByQuality()** (Lines ~320-400)
   - Minimum description length check
   - Valid URL validation
   - Published/updated date validation

---

## IDENTIFIED ISSUES IN FREE SIGNUP

### 🔴 Critical: Strict City Matching (HIGH IMPACT)

**Location**: FreeMatchingStrategy.ts, Line 68-70

**Problem**:
```typescript
const cityMatch = userPrefs.target_cities.some(
  (city) => job.city?.toLowerCase() === city.toLowerCase()
);
```

**Issue**: Requires EXACT city name match
- User selects: "London"
- Job in DB: "london, uk" → ❌ NO MATCH (extra data after city)
- Job in DB: "LONDON" → ✅ Matches (case-insensitive)
- Job in DB: "London" → ✅ Matches

**Fallback** (Line 114-117): Substring match, but only triggered if preFiltered.length === 0

**Why This Causes Bug**:
1. User selects "London"
2. Jobs table has "london, uk" or "london, england" format
3. Exact match fails
4. If there are ANY jobs with exact "london" city, preFiltered still has jobs
5. If NO jobs have exact "london", fallback triggers
6. Fallback uses substring match: "london".includes("london") ✅
7. But if this still returns 0 jobs → **"no_matches_found" error**

---

### 🔴 Critical: Career Path Mapping (HIGH IMPACT)

**Location**: FreeMatchingStrategy.ts, Line 84-86

**Problem**:
```typescript
const dbCategory = FORM_TO_DATABASE_MAPPING[userCareer] || userCareer;
return catLower === dbCategory.toLowerCase();
```

**Issue**: Requires mapping from form value to DB category
- Form shows: "Software Engineer"
- User selects: "Software Engineer"
- DB mapping lookup: `FORM_TO_DATABASE_MAPPING["Software Engineer"]` → ?
- If mapping missing → Falls back to form value "Software Engineer"
- Job category in DB: "backend-engineer" → ❌ NO MATCH
- Job category in DB: "software-engineer" → ✅ Matches

**Why This Causes Bug**:
1. User selects career path from form
2. No matching in FORM_TO_DATABASE_MAPPING → Uses raw form value
3. Job DB has different category naming (kebab-case vs space-separated)
4. Exact match fails
5. Result: All jobs filtered out by career
6. → **"no_jobs_after_filter" error**

**Fix Needed**: Verify FORM_TO_DATABASE_MAPPING has all form values covered

---

### 🟡 High: City Variations Not Comprehensive (MEDIUM IMPACT)

**Location**: PrefilterService.ts, Line 129

**Problem**:
```typescript
const cityVariations = this.buildCityVariations(targetCities);
```

**Issue**: buildCityVariations() might not include all job formats
- User city: "London"
- Job city: "london" → ✅ Works (case-insensitive)
- Job city: "london, uk" → ⚠️ Depends on buildCityVariations
- Job city: "Greater London" → ❌ Might not work
- Job city: "london, england" → ❌ Might not work

---

### 🟡 High: Job Categories Format Mismatch (MEDIUM IMPACT)

**Location**: FreeMatchingStrategy.ts, Line 76-79

**Problem**:
```typescript
!job.categories || job.categories.length === 0 ||
job.categories.some((cat) => { ... })
```

**Issue**: Jobs without categories PASS the filter
- If job has NO categories → Passes through
- If job categories EMPTY array → Passes through
- This could include spam or poorly-categorized jobs

**Why Users See Nothing**:
1. If ALL jobs lack categories → All pass
2. All pass to AI ranker
3. AI ranker might return 0 because no category data
4. Result: Empty matches even though jobs exist

---

### 🟡 Medium: Visa Sponsorship Filtering (MEDIUM IMPACT)

**Location**: PrefilterService.ts, Line 56-66

**Problem**:
```typescript
const visaFiltered = this.filterByVisa(careerFiltered, user);
```

**Issue**: If user needs sponsorship but all jobs require EU citizenship only
- User: "Non-EU (require sponsorship)"
- Job 1: No sponsorship tag → Filtered out
- Job 2: No sponsorship tag → Filtered out
- Job 3: No sponsorship tag → Filtered out
- Result: 0 jobs after visa filter
- → **"no_matches_found"**

**Why This Happens**:
- Many European jobs don't explicitly tag sponsorship
- Jobs that CAN sponsor don't have the flag
- Jobs filtered too aggressively

---

## ROOT CAUSE ANALYSIS

### Most Likely Scenario for "No Matches Found" Bug:

**Scenario 1: City Format Mismatch** (Probability: HIGH)
1. User selects: ["London"]
2. Jobs in DB: formatted as "london, uk" or "london, england"
3. Exact match (line 69) fails
4. Prefiltered.length > 0 (other jobs with "london" exact) → No fallback triggered
5. Other jobs don't match career path
6. Result: 0 matches
7. → Error: "no_jobs_after_filter"

**Scenario 2: Career Path Mapping Incomplete** (Probability: HIGH)
1. User selects: "Senior Manager"
2. FORM_TO_DATABASE_MAPPING missing "Senior Manager"
3. Falls back to raw form value "Senior Manager"
4. Job category: "management-executive"
5. Exact match fails
6. Result: All jobs filtered by career
7. → Error: "no_jobs_after_filter"

**Scenario 3: Visa Sponsorship Too Strict** (Probability: MEDIUM)
1. User: "Non-EU (require sponsorship)"
2. All jobs lack sponsorship tag (default false)
3. Visa filter removes all
4. Result: 0 jobs after visa filter
5. → Error: "no_matches_found"

**Scenario 4: Job Quality Filters Too Strict** (Probability: LOW)
1. Jobs filtered for: description length, URL validity, published date
2. If threshold too high → removes too many jobs
3. Result: 0 jobs after quality filter

---

## HOW TO IDENTIFY WHICH SCENARIO

### Check Sentry Error Tags:

```
error_type: "no_jobs_found" 
  → Job fetching failed (database issue)

error_type: "no_jobs_for_matching"
  → Jobs fetched but 0 after prefilter

error_type: "no_matches_found"
  → Jobs prefiltered but 0 after matching
```

### Check Logs for Clues:

Look for these in console logs:

```
[FREE SIGNUP] Pre-filtered jobs
  original: 1000
  afterPreFilter: 0
  → City/Career filter too strict

[FREE SIGNUP] Matching complete
  matchesCount: 0
  method: "fallback"
  → Prefilter worked, but AI ranker failed
```

---

## RECOMMENDED FIXES

### Fix 1: Improve City Matching (Lines 67-99)

**Current**:
```typescript
const cityMatch = userPrefs.target_cities.some(
  (city) => job.city?.toLowerCase() === city.toLowerCase()
);
```

**Better**:
```typescript
const cityMatch = userPrefs.target_cities.some((city) => {
  const jobCityLower = job.city?.toLowerCase() || "";
  const jobLocationLower = job.location?.toLowerCase() || "";
  const city_lower = city.toLowerCase();
  
  // Exact match
  if (jobCityLower === city_lower) return true;
  
  // Starts with (handles "london, uk")
  if (jobCityLower.startsWith(city_lower)) return true;
  if (jobLocationLower.startsWith(city_lower)) return true;
  
  // Contains (handles "Greater London")
  if (jobCityLower.includes(city_lower)) return true;
  if (jobLocationLower.includes(city_lower)) return true;
  
  return false;
});
```

### Fix 2: Debug Career Path Mapping (Lines 84-86)

**Add logging**:
```typescript
const dbCategory = FORM_TO_DATABASE_MAPPING[userCareer] || userCareer;
console.log(`Career mapping: "${userCareer}" → "${dbCategory}"`);
```

Then check if mapping is working for all form options.

### Fix 3: Reduce Visa Sponsorship Strictness

**Current** (PrefilterService): Only jobs with sponsorship flag
**Better**: Jobs without sponsorship tag = assumed available to sponsor

```typescript
private filterByVisa(jobs, user) {
  if (user.visa_status === "eu-citizen") {
    // Only EU jobs
    return jobs.filter(j => !j.requires_eu_citizenship === false);
  }
  
  // Non-EU: Include all jobs (default assume can sponsor)
  // Don't filter aggressively
  return jobs;
}
```

---

## VERIFICATION STEPS

1. **Check job city formats**:
   ```sql
   SELECT DISTINCT city FROM jobs LIMIT 20;
   ```
   Look for "london, uk" format

2. **Check job categories**:
   ```sql
   SELECT DISTINCT categories FROM jobs WHERE categories IS NOT NULL LIMIT 20;
   ```
   Look for "backend-engineer" vs "software engineer"

3. **Check visa sponsorship**:
   ```sql
   SELECT COUNT(*), visa_sponsorship FROM jobs GROUP BY visa_sponsorship;
   ```
   Are most jobs missing sponsorship tag?

4. **Test locally**:
   ```bash
   # Enable debug logging
   SENTRY_DEBUG=true npm run dev
   
   # Submit free signup form
   # Check console for filter stages
   # Look for "Pre-filtered jobs: original: X, afterPreFilter: 0"
   ```

---

## NEXT ACTIONS

1. **Immediate**: Check Sentry for `error_type: "no_jobs_for_matching"` frequency
2. **Today**: Log job city/category formats being filtered
3. **This week**: Fix city matching logic (Fix #1)
4. **This week**: Verify career path mapping (Fix #2)
5. **Next week**: Reduce visa sponsorship strictness (Fix #3)

