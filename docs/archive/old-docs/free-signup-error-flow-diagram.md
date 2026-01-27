# Free Signup - Complete Error Flow Diagram

## High-Level Request Flow

```
USER SUBMITS FORM (SignupFormFree.tsx)
│
├─ Client-side validation
│  └─ If errors → Display errors, show "client_validation" warning in Sentry
│
├─ POST /api/signup/free
│  │
│  ├─ STAGE 1: RATE LIMITING (line 341)
│  │  ├─ Exceeded? → 429 + "rate_limit" warning
│  │  └─ OK? Continue
│  │
│  ├─ STAGE 2: REQUEST BODY & VALIDATION (line 367-430)
│  │  ├─ Parse JSON body
│  │  ├─ Zod schema validation
│  │  ├─ Invalid? → 400 + "validation" warning + error details
│  │  └─ Valid? Continue
│  │
│  ├─ STAGE 3: USER CHECKS (line 449-556)
│  │  ├─ Check if email already exists
│  │  ├─ Exists? → 409 + redirect to matches
│  │  ├─ DB Error? → "user_check" warning, continue anyway
│  │  └─ New user? Continue
│  │
│  ├─ STAGE 4: USER CREATION (line 602-691)
│  │  ├─ Minimal insert (id, email)
│  │  ├─ Failed? → 500 + "user_creation" error
│  │  ├─ Success? Continue
│  │  ├─ Update with full data
│  │  ├─ Update failed? → "user_update" warning, continue with minimal
│  │  └─ Continue
│  │
│  ├─ STAGE 5: JOB FETCHING (line 764-848)
│  │  ├─ Fetch active jobs from last 60 days
│  │  ├─ Query result:
│  │  │  ├─ Jobs found? → Continue
│  │  │  ├─ None found? → Try fallback (country-level)
│  │  │  ├─ Fallback found? → Continue
│  │  │  └─ Still none? → 404 + "no_jobs_found" error
│  │  └─ Jobs fetched
│  │
│  ├─ STAGE 6: MATCHING ENGINE (line 949-1020)
│  │  ├─ Call SignupMatchingService.runMatching()
│  │  ├─ Internal: Pre-filter jobs
│  │  │  ├─ Filter by city (exact match)
│  │  │  ├─ Filter by career path
│  │  │  ├─ Pre-filter result:
│  │  │  │  ├─ 0 jobs? → Try fallback (substring city match)
│  │  │  │  ├─ Still 0? → "no_jobs_after_filter" 
│  │  │  │  └─ Jobs found? Continue
│  │  │  └─ AI ranking & return top 5
│  │  ├─ Match result:
│  │  │  ├─ 0 matches? → 404 + "no_matches_found" info
│  │  │  ├─ 1-5 matches? → 200 + success
│  │  │  └─ Matches saved to DB
│  │  └─ Matching complete
│  │
│  └─ STAGE 7: RESPONSE (line 1023-1081)
│     ├─ Set session cookie
│     └─ Return 200 + matchCount + userId
│
└─ SUCCESS or ERROR
   ├─ Success → Save preferences, redirect to /matches
   ├─ 400 Error → Parse errors, display per-field, show "api_validation" warning
   ├─ 409 Error → Show "account exists" message, redirect anyway
   └─ Other → Show generic error + "api_error" exception
```

## Error Decision Tree

```
                         FORM SUBMITTED
                              │
                        ┌─────┴──────┐
                        ▼            ▼
                   CLIENT VALIDATION  (LOCAL)
                        │
                   ┌────┴─────┐
              PASS│           │FAIL
                  ▼           ▼
            API CALL       SHOW ERRORS
            TO /api         (Don't send)
          /signup/free
                  │
         ┌────────┴──────────┐
         ▼                   ▼
    RATE LIMIT?          VALIDATION
       (429)              (400)
    │   │   │          │   │   │
   YES  NO  │          │   │   │
    │   │   │    PASS  │   │   │
    │   │   │    ▼     │   │   │
    │   │   │   USER   │   │   │
    │   │   │  CHECK   │   │   │
    │   │   │   (409)  │   │   │
    │   │   │   │ YES  │   │   │
    │   │   │   ▼      │   │   │
    │   │   │ CREATE   │   │   │
    │   │   │  USER    │   │   │
    │   │   │  (500)   │   │   │
    │   │   │   │ OK   │   │   │
    │   │   │   ▼      │   │   │
    │   │   │ FETCH    │   │   │
    │   │   │  JOBS    │   │   │
    │   │   │  (404)   │   │   │
    │   │   │   │ OK   │   │   │
    │   │   │   ▼      │   │   │
    │   │   │ MATCH    │   │   │
    │   │   │  JOBS    │   │   │
    │   │   │  (404)   │   │   │
    │   │   │   │ OK   │   │   │
    │   │   │   ▼      │   │   │
    │   │   │ SUCCESS  │   │   │
    │   │   │  (200)   │   │   │
    │   │   └───┬───────┴─────┘
    │   │       │
    └───┼───────┼─── SEND TO SENTRY
        └───────┘    WITH CONTEXT
```

## Error Type Classification

### Critical Errors (Block Signup)
```
┌─────────────────────────────────┐
│ RATE_LIMIT (429)                │ → User hit limit (10/hour)
│ VALIDATION (400)                │ → Invalid form data
│ USER_CREATION (500)             │ → Database error creating user
│ NO_JOBS_FOUND (404)             │ → No jobs in database
│ NO_JOBS_FOR_MATCHING (404)      │ → All jobs filtered out
│ NO_MATCHES_FOUND (404)          │ → Matching engine failed
└─────────────────────────────────┘
```

### Warning Errors (Don't Block, Log)
```
┌─────────────────────────────────┐
│ USER_CHECK warning              │ → DB error checking user
│ USER_UPDATE warning             │ → DB error updating fields
│ VALIDATION warning              │ → Client-side form issues
│ API_VALIDATION warning          │ → Server validation failed
│ API_ERROR error                 │ → Network/server error
└─────────────────────────────────┘
```

## Data Flow Through Filters

### FreeMatchingStrategy.ts (Lines 67-99)

```
JOBS (1000+)
    ↓
FILTER: CITY
    ├─ Exact match: job.city === user.city
    ├─ Success rate depends on city naming in DB
    ├─ "london" == "london" ✅
    ├─ "london" == "london, uk" ❌
    └─ IF NO MATCHES: Use fallback (substring)
    
FILTER: CAREER
    ├─ Map user career to DB category
    ├─ Exact category match
    ├─ If no categories in job: PASS (allow through)
    └─ "software-engineer" match: Case insensitive
    
RESULT: PRE-FILTERED JOBS
    ├─ If 0 jobs: Try fallback
    ├─ If still 0: Error "no_jobs_after_filter"
    └─ If 1+: Continue to AI ranking
    
AI RANKING: TOP 5 MATCHES
    ├─ Use simplifiedMatchingEngine
    ├─ Score and rank jobs
    ├─ If 0 matches: Error "no_matches_found"
    └─ If 1-5: Success, save to DB

SUCCESS
    └─ Return 200 + matchCount
```

### PrefilterService.ts (Secondary Filter Chain)

```
JOBS (Prefiltered)
    ↓
filterByLocation()
    ├─ Exact city match
    ├─ Contains city variation
    ├─ Fallback: Country-level (need 5+ jobs)
    └─ Fallback: First 50 jobs (broad match)
    ↓
filterByCareerPath()
    ├─ Map form career to categories
    ├─ Exact category match
    └─ If no mapping: Use raw value
    ↓
filterByVisa()
    ├─ Non-EU user: Only jobs with sponsorship flag
    ├─ EU user: Only EU jobs
    └─ 🔴 ISSUE: Too strict (many jobs lack flag)
    ↓
filterByQuality()
    ├─ Min description length
    ├─ Valid URL check
    └─ Published date validation
    ↓
scoreJobs()
    ├─ Calculate unified score
    └─ Add freshness tier
    ↓
ensureDiversity()
    ├─ Distribute across job sources
    └─ Return final results
```

## Sentry Tag Structure

```
Every request tagged with:

endpoint: "signup-free"
error_type: <one of:
  - "rate_limit"           → 429 error
  - "validation"           → 400 error
  - "user_check"           → DB check failed
  - "user_check_unexpected"→ Unexpected error in check
  - "user_creation"        → User creation failed
  - "user_update"          → User update failed
  - "no_jobs_found"        → No jobs in DB
  - "no_jobs_for_matching" → All jobs filtered
  - "no_matches_found"     → Matching failed
  - "client_validation"    → Form validation failed
  - "api_validation"       → API validation failed
  - "api_error"            → Network/API error
  - "unexpected_error"     → Unhandled exception
>

Plus context:
- requestId: UUID for tracing
- email: User email
- cities: User selected cities
- careerPath: User selected career
- status_code: HTTP status (if applicable)
```

## Example: City Mismatch Bug

```
User selects: ["London"]

Request to /api/signup/free
    ↓
Jobs fetched: {
    city: "london, uk",      ← Different format!
    categories: ["backend"]
}

FreeMatchingStrategy filter:
    ├─ cityMatch check:
    │  job.city = "london, uk"
    │  user city = "london"
    │  "london, uk" === "london" ? ❌ NO
    │
    ├─ No exact city match
    ├─ Check if other jobs match: (assume yes)
    ├─ Pre-filtered.length > 0
    ├─ DON'T trigger fallback (only if 0)
    └─ Continue to AI ranking

AI ranking:
    ├─ Gets jobs without london
    ├─ Can't find matches
    └─ Return 0 matches

Result: 404 + "no_matches_found"
Sentry: error_type: "no_matches_found"
User sees: "No matches found..."

🔴 BUG: User HAS valid cities, but formatting causes no matches
```

## Example: Career Path Mapping Bug

```
User selects: ["Senior Manager"]

FORM_TO_DATABASE_MAPPING:
    ├─ "Software Engineer" → "backend-engineer" ✅
    ├─ "Product Manager" → "product-manager" ✅
    ├─ "Senior Manager" → ??? ❌ MISSING
    
Career matching in filter:
    ├─ dbCategory = FORM_TO_DATABASE_MAPPING["Senior Manager"]
    ├─ Not found → Use raw "Senior Manager"
    ├─ Job categories: ["management-executive"]
    ├─ "senior manager" === "management-executive" ? ❌ NO
    
Result: ❌ NO CAREER MATCH

All jobs filtered by career:
    ├─ Pre-filtered: 0 jobs
    ├─ Fallback triggered (substring city match)
    ├─ Gets jobs but with wrong career
    ├─ AI ranking returns 0
    
Result: 404 + "no_jobs_after_filter"
Sentry: error_type: "no_jobs_after_filter"

🔴 BUG: Incomplete career path mapping
```

## Monitoring & Debugging

### Check Error Frequency by Type

```sql
SELECT error_type, COUNT(*) as count
FROM sentry_errors
WHERE endpoint = "signup-free"
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY error_type
ORDER BY count DESC;

Expected results:
- Many "no_matches_found"? → City/Career filter issue
- Many "validation"? → Form UX issue
- Many "user_creation"? → Database issue
- Many "no_jobs_found"? → Scraping issue
```

### Local Debugging

```bash
# Enable verbose logging
SENTRY_DEBUG=true npm run dev

# In browser, submit form
# Watch console for:
# [FREE SIGNUP] Pre-filtered jobs: original: X, afterPreFilter: Y
# If Y=0, filter is too strict

# Check server logs for:
# Career mapping: "Senior Manager" → "senior manager"
# If mapping shows raw value (no mapping), that's the issue
```

---

**Last Updated**: January 27, 2026  
**Status**: Under Investigation  
**Priority**: HIGH (Blocking free signups)
