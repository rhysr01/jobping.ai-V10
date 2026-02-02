# Career Path Keywords - Reusable System

**Date:** January 29, 2026  
**Status:** ✅ Complete & Exportable

---

## 📦 OVERVIEW

The career path keywords have been extracted and exported from `careerPathInference.cjs` for reuse across multiple scripts and analysis tools.

### Available Keywords by Path

```
strategy-business-design:     55 keywords
finance-investment:           57 keywords
sales-client-success:         42 keywords
marketing-growth:             76 keywords (largest set)
product-innovation:           21 keywords
operations-supply-chain:      80 keywords (largest set)
data-analytics:               31 keywords
tech-transformation:          67 keywords
sustainability-esg:           30 keywords
────────────────────────────────────
TOTAL:                         ~459 keywords
```

---

## 🔌 HOW TO USE

### Import Keywords in Any Script

```javascript
const { CAREER_PATH_KEYWORDS } = require('./scrapers/shared/careerPathInference.cjs');

// Access keywords for a specific path
const strategyKeywords = CAREER_PATH_KEYWORDS['strategy-business-design'];
console.log(`Strategy keywords: ${strategyKeywords.length}`);

// Iterate all paths
Object.entries(CAREER_PATH_KEYWORDS).forEach(([path, keywords]) => {
  console.log(`${path}: ${keywords.length} keywords`);
});
```

### Use the Generic Analysis Script

```bash
# Demo mode (shows keyword summary and sample analysis)
node analyze-keywords.js

# Analyze a batch of jobs from JSON file
node analyze-keywords.js jobs-batch.json
```

### Import Analysis Functions

```javascript
const { 
  CAREER_PATH_KEYWORDS,
  analyzeJobs,
  printStats,
  generateSQL,
  showKeywordSummary 
} = require('./analyze-keywords.js');

// Analyze your jobs
const results = analyzeJobs([
  { id: '1', title: 'Sachbearbeiter', description: '' },
  { id: '2', title: 'SDR', description: '' }
]);

printStats(results);
generateSQL(results);
```

---

## 📄 FILES STRUCTURE

### Core Files

#### `careerPathInference.cjs` - Main Module
- **Exports:**
  - `CAREER_PATH_KEYWORDS` - ✅ Reusable keyword sets (NEW)
  - `SENIOR_INDICATORS` - Seniority detection patterns
  - `JUNIOR_INDICATORS` - Junior role patterns
  - `GRADUATE_INDICATORS` - Graduate program patterns
  - `INTERNSHIP_INDICATORS` - Internship patterns
  - `inferCareerPath()` - Core inference function
  - `determineSeniority()` - Seniority detection
  - `getInferredCategories()` - Main API function

#### `analyze-keywords.js` - Generic Analysis Script (NEW)
- Reusable analysis tool
- Works with any batch of jobs
- Generates SQL migrations
- Shows keyword statistics
- Demo mode for testing

### Test/Analysis Files

- `test-improved-inference.js` - 13 test cases (92.3% accuracy)
- `test-phase6a-keywords.js` - 32 Phase 6A tests (96.9% accuracy)
- `phase6a-production-migration.js` - Production batch analysis
- `generate-phase6a-sql.js` - SQL generation (mock)

---

## 💻 EXAMPLE: Batch Analysis Script

```javascript
const { analyzeJobs, CAREER_PATH_KEYWORDS } = require('./analyze-keywords.js');

// Your unsure jobs
const unsureJobs = [
  { id: 'uuid-1', title: 'Sachbearbeiter', description: 'Admin role' },
  { id: 'uuid-2', title: 'SDR Trainee', description: 'Sales' },
  { id: 'uuid-3', title: 'Unknown', description: '' }
];

// Analyze
const stats = analyzeJobs(unsureJobs);

// Show results
console.log(`Reclassified: ${stats.reclassified}/${stats.total}`);

// Get SQL for updates
for (const [path, ids] of Object.entries(stats.reclassifications)) {
  console.log(`UPDATE jobs SET categories = ARRAY['${path}'] WHERE id IN ('${ids.join("','")}');`);
}
```

---

## 🎯 PHASE 6A KEYWORDS ADDED

### High-Value Administrative Keywords
- `sachbearbeiter` (German) - Most impactful
- `impiegato` (Italian)
- `addetto` (Italian)
- `coordinat*` (multiple languages)

### Sales Development
- `sales development`
- `sdr` (emphasis)
- `account officer`
- `commerciel`
- `außendienst`

### Finance/Accounting
- `buchhalter` (German)
- `comptable` (French)
- `boekhouden` (Dutch)

### Marketing/Communications
- `relations publiques` (French)
- `kommunikation` (German)
- `kreativ` (German)
- `medienberater` (German)

### Operations/Logistics
- `dispatcher`
- `planner`
- `buyer`
- `trainee` (generic)
- `berufseinsteiger` (German)

### Tech
- `webentwickler` (German)
- `datenbankadministrator` (German)
- `sistemista junior` (Italian)

---

## 📊 REUSE SCENARIOS

### 1. Quarterly Keyword Refresh
```javascript
// Import latest keywords
const { CAREER_PATH_KEYWORDS } = require('./careerPathInference.cjs');

// Analyze new unsure batch
const newStats = analyzeJobs(newUnsureBatch);

// Generate migrations
generateSQL(newStats);
```

### 2. Ad-hoc Pattern Analysis
```javascript
// Research specific keywords for a path
const marketingKeywords = CAREER_PATH_KEYWORDS['marketing-growth'];

// Find which keywords are actually matching
const matchingJobs = findJobsMatchingKeywords(
  unsureJobs, 
  marketingKeywords
);
```

### 3. Keyword Validation
```javascript
// Test new keywords before adding to production
const testKeywords = { ...CAREER_PATH_KEYWORDS };
testKeywords['strategy-business-design'].push('new-keyword');

// Validate on test batch
const testResults = analyzeJobs(testBatch, testKeywords);
```

### 4. Language-Specific Analysis
```javascript
// Filter keywords by language
const germanKeywords = CAREER_PATH_KEYWORDS['operations-supply-chain']
  .filter(kw => kw.includes('ä') || kw.includes('ü') || kw.includes('ö'));
```

---

## 🔄 WORKFLOW FOR FUTURE PHASES

### Phase 6B Secondary Keywords
1. Identify candidate keywords from unsure job analysis
2. Add to `CAREER_PATH_KEYWORDS` in `careerPathInference.cjs`
3. Commit change to core module
4. Run `node analyze-keywords.js` on unsure batch
5. Generate and apply SQL migrations
6. Measure impact

### Phase 7 Context Analysis
1. Export `CAREER_PATH_KEYWORDS` ✅ (Done)
2. Build NLP context analyzer using keywords as baseline
3. Add context scoring to `inferCareerPath()`
4. Test with real job titles
5. Integrate into main inference pipeline

---

## ✅ BENEFITS

✅ **Reusable** - Use same keywords across all scripts  
✅ **Maintainable** - Update once, propagate everywhere  
✅ **Testable** - Generic analysis script for validation  
✅ **Extensible** - Easy to add new keywords or phases  
✅ **Transparent** - Clear keyword statistics and counts  
✅ **Batch-friendly** - Process any size job batch  

---

## 📋 CURRENT STATUS

| Component | Status | Details |
|-----------|--------|---------|
| CAREER_PATH_KEYWORDS export | ✅ Done | Available in careerPathInference.cjs |
| analyze-keywords.js | ✅ Done | Generic reusable script |
| Demo/Test mode | ✅ Done | Working with sample data |
| Phase 6A integration | ✅ Done | 243 jobs reclassified |
| Documentation | ✅ Done | This file |

---

**Ready for:** Phase 6B keywords, quarterly refreshes, and future NLP analysis! 🚀

