# 🎯 Career Path Structure - Quick Reference

## The Problem (Fixed ✅)
```javascript
// BEFORE (WRONG):
categories: ["early-career", "tech-transformation", "internship"]
is_early_career: true
is_internship: true
is_graduate: false

// AFTER (CORRECT):
categories: ["tech-transformation"]  // ONLY the career path
is_early_career: true                // SEPARATE boolean flag
is_internship: true                  // SEPARATE boolean flag
is_graduate: false                   // SEPARATE boolean flag
```

---

## What Changed

| Component | Change |
|-----------|--------|
| **categoryMapper.cjs** | Removed early-career from valid categories ✅ |
| **careerPathInference.cjs** | Returns ONLY career path, not entry-level ✅ |
| **processor.cjs** | Accepts categories in options, sets flags separately ✅ |
| **Database** | Cleanup Edge Function created (deploy to run) ⏳ |

---

## 10 Valid Career Paths

```
1. strategy-business-design
2. data-analytics
3. sales-client-success
4. marketing-growth
5. finance-investment
6. operations-supply-chain
7. product-innovation
8. tech-transformation
9. sustainability-esg
10. unsure (fallback)
```

---

## 3 Entry-Level Type Flags

```
is_early_career: boolean  (entry-level role?)
is_internship: boolean    (internship placement?)
is_graduate: boolean      (graduate program?)
```

---

## How Scrapers Use It

```javascript
// 1. Get inferred career path
const categories = getInferredCategories(title, description);
// Returns: ["tech-transformation"] or ["unsure"]

// 2. Pass to processor
const processed = await processIncomingJob(job, {
  source: "careerjet",
  categories,  // Pass the career path
});

// 3. Processor automatically sets:
// - is_early_career (via classifyEarlyCareer)
// - is_internship (via classifyJobType)
// - is_graduate (via classifyJobType)
```

---

## Database Query Examples

```sql
-- Find all early-career junior roles in tech
SELECT * FROM jobs
WHERE 'tech-transformation' = ANY(categories)
  AND is_early_career = true
  AND is_internship = false;

-- Find all internship roles
SELECT * FROM jobs
WHERE is_internship = true;

-- Find all graduate programs
SELECT * FROM jobs
WHERE is_graduate = true;

-- Find specific career path (strategy)
SELECT * FROM jobs
WHERE 'strategy-business-design' = ANY(categories);
```

---

## Validation Rules

### Valid categories array:
✅ `["tech-transformation"]`
✅ `["data-analytics"]`
✅ `["unsure"]`
✅ `["finance-investment"]`

### INVALID (now rejected):
❌ `["early-career", "tech-transformation"]` ← Remove early-career!
❌ `["internship"]` ← Use is_internship flag instead!
❌ `["graduate"]` ← Use is_graduate flag instead!
❌ `["general"]` ← Use ["unsure"] instead!
❌ `["people-hr"]` ← Not a valid path
❌ `["creative-design"]` ← Not a valid path

---

## Status: Ready to Use ✅

All scrapers and processors updated
Code linting passes ✅
Database cleanup script ready (deploy via Supabase)
Next step: Run scrapers to test

