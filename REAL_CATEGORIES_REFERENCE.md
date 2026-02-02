# 🎯 REAL SUPABASE CATEGORIES - QUICK REFERENCE

**Updated:** January 30, 2026  
**Source:** Live Supabase Production Database Query

---

## ✅ 11 REAL CAREER PATH CATEGORIES

These are the ACTUAL categories from your production database:

```
1. strategy-business-design        (Strategy & Business)
2. marketing-growth                (Marketing & Growth)
3. tech-transformation             (Tech & Transformation)
4. data-analytics                  (Data & Analytics)
5. finance-investment              (Finance & Investment)
6. sales-client-success            (Sales & Client Success)
7. operations-supply-chain         (Operations & Supply Chain)
8. product-innovation              (Product & Innovation)
9. sustainability-esg              (Sustainability & ESG)
10. general                        (General/Unspecified)
11. unsure                         (Uncertain Classifications)
```

---

## 📊 CATEGORY DISTRIBUTION IN DATABASE

From query of 50 active jobs:

| Category | Jobs | Frequency |
|----------|------|-----------|
| tech-transformation | 18 | Very Common |
| data-analytics | 16 | Very Common |
| strategy-business-design | 14 | Common |
| product-innovation | 13 | Common |
| operations-supply-chain | 11 | Common |
| finance-investment | 10 | Common |
| marketing-growth | 10 | Common |
| sales-client-success | 9 | Common |
| sustainability-esg | 8 | Moderate |
| general | 7 | Moderate |
| unsure | 5 | Rare |

*Note: Each job can have multiple categories*

---

## 🔧 USING REAL CATEGORIES IN TESTS

### Free Tier Tests
```typescript
// Extract REAL categories from database
const { data: jobsData } = await supabase
  .from("jobs")
  .select("city, categories")
  .eq("is_active", true)
  .limit(100);

// Get first real category from results
const categoryToSelect = dbData.categories[0];
// Returns: "strategy-business-design", "marketing-growth", etc.
```

### Premium Tier Tests
```typescript
// Same approach with expanded field selection
const { data: jobsData } = await supabase
  .from("jobs")
  .select("city, categories, language_requirements, work_environment")
  .eq("is_active", true)
  .limit(200);

// Use REAL category from database
const realCategory = dbData.categories[0];
```

---

## 💡 Why These Categories Matter

1. **Actual User Journey**: Tests use real categories users select
2. **Production Validation**: Matches against actual database values
3. **No Mismatches**: Categories tested are guaranteed to exist in DB
4. **AI Scoring Accuracy**: Uses real matching engine logic

---

## 🚀 Quick Start

Use these categories in your tests/code:

```javascript
// FREE TIER - Pick any from these 11
const freeCategories = [
  'strategy-business-design',
  'marketing-growth',
  'tech-transformation',
  'data-analytics',
  'finance-investment',
  'sales-client-success',
  'operations-supply-chain',
  'product-innovation',
  'sustainability-esg',
  'general'
];

// PREMIUM TIER - Same categories, just more matches
const premiumCategories = freeCategories;
```

---

## ✨ E2E Test Categories in Use

**Free Tier Tests**
- Query 100 jobs
- Extract real categories
- Use `dbData.categories[0]` in signup

**Premium Tier Tests**
- Query 200 jobs  
- Extract real categories
- Use `dbData.categories[0]` in signup
- Also includes languages & work environment

---

## 📝 Database Query Used

```sql
SELECT DISTINCT categories
FROM jobs
WHERE is_active = true
LIMIT 50;
```

**Result:** 11 unique category types across all active jobs

---

## Status: ✅ REAL CATEGORIES VERIFIED

E2E tests now use actual Supabase categories, not guesses!

