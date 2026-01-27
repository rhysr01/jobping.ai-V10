# Data Quality Issues Report

**Generated**: January 27, 2026  
**Database**: Supabase Production  
**Total Active Jobs**: 27,285

---

## Executive Summary

The database contains 27,285 active jobs, but data quality issues significantly impact matching accuracy and user experience:

- **🔴 CRITICAL**: 100% of jobs are missing embeddings (0/27,285)
- **⚠️ HIGH**: 38.3% of jobs are missing descriptions (10,446/27,285)
- **⚠️ MEDIUM**: 14.4% of jobs are missing cities (3,939/27,285)
- **✅ GOOD**: 100% have categories, company names, and URLs

---

## 1. Embeddings Crisis (BLOCKING QUALITY AI MATCHING)

### Problem
**0 out of 27,285 jobs have embeddings generated.**

| Metric | Count | Percentage |
|--------|-------|-----------|
| Total Active Jobs | 27,285 | 100% |
| Jobs with Embeddings | 0 | **0%** |
| Jobs Missing Embeddings | 27,285 | **100%** |

### Impact
- **Semantic similarity matching is non-functional** - The matching system relies on OpenAI text embeddings to determine job-user fit
- **Free users get low-quality matches** - Without embeddings, matching falls back to keyword/category matching only
- **Premium users experience degraded recommendations** - The weekly matching quality is severely compromised
- **AI accuracy target unreachable** - Cannot achieve 85-97% accuracy target without embeddings

### Root Cause
The embedding generation pipeline (likely a scheduled cron job or background worker) is **not running or has failed silently**.

### Required Fix
1. **Check cron job status**: Review `/app/api/cron/` for embedding generation jobs
2. **Verify OpenAI integration**: Confirm API key is valid and tokens are available
3. **Batch generate embeddings**: Run a one-time script to generate all 27,285 embeddings
4. **Enable auto-generation**: Ensure new jobs get embeddings upon creation

---

## 2. Missing Descriptions (IMPACTS RELEVANCE SCORING)

### Problem
**10,446 out of 27,285 jobs lack adequate descriptions.**

| Metric | Count | Percentage |
|--------|-------|-----------|
| Jobs with Descriptions | 16,839 | 61.7% |
| Jobs Missing/Short Descriptions | 10,446 | **38.3%** |

### Impact by City

| City | Total | With Description | With Description % |
|------|-------|------------------|-------------------|
| (NULL) | 3,939 | 136 | 3.5% |
| Dublin | 2,816 | 1,761 | 62.5% |
| London | 2,322 | 1,315 | 56.7% |
| Paris | 1,907 | 1,357 | 71.2% |
| Berlin | 1,391 | 1,038 | 74.6% |
| Milan | 1,386 | 1,145 | 82.6% |
| Munich | 1,278 | 967 | 75.7% |
| Rome | 1,120 | 1,069 | 95.4% |
| Madrid | 1,029 | 682 | 66.3% |
| Barcelona | 950 | 667 | 70.2% |

### Issues
- **NULL city jobs have worst descriptions**: Only 3.5% have descriptions (136/3,939)
- **Geographic inconsistency**: Rome has 95.4% description coverage; Dublin has only 62.5%
- **Job scraper data quality**: Different job board scrapers provide different data quality

### Impact on Matching
- Descriptions are essential for embedding generation
- Missing descriptions → worse embeddings → poor semantic matching
- Users may match with irrelevant jobs that lack context

### Required Fix
1. **Improve job scraper logic** to extract descriptions from all sources (Arbeitnow, Careerjet, Jooble, Reed, Adzuna)
2. **Fallback to job title + company** if description unavailable
3. **Validate job data quality** during ingestion
4. **Target**: Reach 95%+ description coverage

---

## 3. Missing Location Data (IMPACTS GEOGRAPHIC FILTERING)

### Problem
**3,465 out of 27,285 jobs have neither city nor location data.**

| Metric | Count | Percentage |
|--------|-------|-----------|
| Jobs with City | 23,346 | 85.6% |
| Jobs with Location | 23,820 | 87.3% |
| Jobs Missing Both City & Location | 3,465 | **12.7%** |
| Jobs with NULL City | 3,939 | **14.4%** |

### Impact
- **Geographic filtering fails** - Users searching for specific cities get NULL results mixed in
- **Regional preferences ignored** - Jobs can't be filtered by user's target location
- **User frustration** - "No jobs found" when actually there are matching jobs with unknown locations

### Why This Matters for Our Fixes
- Our recent fix (Fix #1) made NULL cities partially match, but ideally should be zero
- This represents **unmapped job data** from scrapers that failed to extract location

### Required Fix
1. **Improve location extraction** in job scrapers
2. **Implement fallback detection** (parse from job description/company location)
3. **Geocoding service** to enhance partial location data
4. **Target**: Reach 98%+ location coverage

---

## 4. Completeness Analysis

### Jobs with Complete Metadata

| Completeness Level | Count | Percentage |
|-------------------|-------|-----------|
| **All fields complete** | 16,703 | **61.2%** |
| Missing embeddings only | 16,703 | **61.2%** |
| Missing descriptions | 10,446 | **38.3%** |
| Missing location data | 3,465 | **12.7%** |

### Analysis
- **61.2% of jobs are "good candidates"** for matching if embeddings were generated
- **These 16,703 jobs** have:
  - ✅ City or location data
  - ✅ Meaningful description (>10 chars)
  - ✅ Categories
  - ✅ Company name
  - ✅ Job URL
  - ❌ BUT missing embeddings

---

## 5. Data Quality by Category

| Metric | Status | Count | Coverage |
|--------|--------|-------|----------|
| **Embeddings** | 🔴 CRITICAL | 0 / 27,285 | **0%** |
| **Descriptions** | ⚠️ HIGH | 16,839 / 27,285 | 61.7% |
| **Cities** | ⚠️ MEDIUM | 23,346 / 27,285 | 85.6% |
| **Categories** | ✅ GOOD | 27,285 / 27,285 | 100% |
| **Company Names** | ✅ GOOD | 27,285 / 27,285 | 100% |
| **Job URLs** | ✅ GOOD | 27,285 / 27,285 | 100% |

---

## 6. Recommendations & Action Items

### Phase 1: IMMEDIATE (Blocking Matching Quality)
- [ ] **Diagnose embedding generation failure**
  - Check `/app/api/cron/` endpoints for embedding jobs
  - Review Sentry for embedding generation errors
  - Verify OpenAI API quota and rate limits
- [ ] **Generate embeddings for all jobs**
  - Create emergency batch job to generate 27,285 embeddings
  - Estimated cost: ~$2-3 USD at text-embedding-3-small rates
  - Estimated time: ~30 minutes
- [ ] **Enable auto-embedding on job creation**
  - Ensure new jobs get embeddings immediately
  - Add error handling and retry logic

### Phase 2: SHORT-TERM (Improve Data Quality)
- [ ] **Enhance job scraper descriptions** (Target: 90%+ coverage)
  - Review each job board scraper (Arbeitnow, Careerjet, Jooble, Reed, Adzuna)
  - Add fallback extraction logic
  - Validate data quality before storage
- [ ] **Fix location extraction** (Target: 98%+ coverage)
  - Improve city/location parsing from job details
  - Add geocoding fallback
  - Reduce NULL city count to <50

### Phase 3: LONG-TERM (System Health)
- [ ] **Implement data quality dashboard**
  - Monitor embedding coverage
  - Track description completeness by source
  - Alert on quality degradation
- [ ] **Add validation layer**
  - Reject jobs missing critical fields (city or description)
  - Flag suspicious data patterns
- [ ] **Archive incomplete jobs**
  - Old jobs with low metadata completeness should be marked inactive

---

## 7. Matching Quality Impact Analysis

### Current State: Estimated Quality Score
```
Base Matching Capability: 40/100
- Keyword/category matching: 40/100 (functional but basic)
- Semantic similarity: 0/100 (NO EMBEDDINGS!)
- Location filtering: 85/100 (85.6% jobs have location)
- Business rules: 90/100 (mostly functional)
```

### After Embedding Fix: Estimated Quality Score
```
Improved Capability: 75/100
- Keyword/category matching: 40/100
- Semantic similarity: 90/100 (AFTER embeddings)
- Location filtering: 85/100
- Business rules: 90/100
```

### After All Data Quality Fixes: Estimated Quality Score
```
Optimal Capability: 90/100+
- Keyword/category matching: 40/100
- Semantic similarity: 95/100 (better embeddings)
- Location filtering: 98/100
- Business rules: 95/100
- Better user satisfaction and repeat usage
```

---

## 8. Risk Assessment

| Issue | Severity | User Impact | Business Impact |
|-------|----------|------------|-----------------|
| No Embeddings | 🔴 CRITICAL | Poor match quality | Low user satisfaction, churn |
| Missing Descriptions | ⚠️ HIGH | Low relevance scores | Weak competitive advantage |
| Missing Locations | ⚠️ MEDIUM | Geographic filter breaks | User frustration |
| Data inconsistency | 🟡 LOW | Unexpected behavior | Technical debt |

---

## Conclusion

The data quality issues are **not preventing the signup fixes from working**, but they are **severely limiting matching accuracy**. The absence of embeddings is the most critical blocker to delivering high-quality recommendations to users.

**Next Steps**:
1. Run embedding generation immediately (get 0→100% coverage)
2. Schedule investigation of why embeddings aren't being generated
3. Implement data quality monitoring dashboard
4. Incrementally improve description/location extraction in scrapers
