# Quick Reference - Reusable Career Keywords System

## 📥 Import Keywords

```javascript
// In any script
const { CAREER_PATH_KEYWORDS } = require('./scrapers/shared/careerPathInference.cjs');
```

## 📊 Get Statistics

```javascript
Object.entries(CAREER_PATH_KEYWORDS).forEach(([path, keywords]) => {
  console.log(`${path}: ${keywords.length} keywords`);
});
```

## 🔍 Analyze Jobs

```javascript
const { analyzeJobs, generateSQL } = require('./analyze-keywords.js');

const results = analyzeJobs([
  { id: '1', title: 'Sachbearbeiter', description: '' },
  { id: '2', title: 'SDR', description: '' }
]);

generateSQL(results); // Outputs UPDATE statements
```

## 🎯 Available Paths & Keyword Counts

| Path | Keywords | Focus Area |
|------|----------|-----------|
| strategy-business-design | 55 | Consulting, business analysis |
| finance-investment | 57 | Accounting, finance, banking |
| sales-client-success | 42 | Sales, customer success |
| marketing-growth | 76 | Marketing, communications, design |
| product-innovation | 21 | Product management |
| operations-supply-chain | 80 | Operations, logistics, admin |
| data-analytics | 31 | Data, analytics, BI |
| tech-transformation | 67 | Software, IT, tech |
| sustainability-esg | 30 | Sustainability, ESG |

**Total: 459 keywords**

## 🔄 Recent Phase 6A Keywords

### Highest Impact
- `sachbearbeiter` (German admin) - Operations path
- `coordinat*` variants - Multiple paths
- `dispatcher`, `planner`, `buyer` - Operations
- `sales development` - Sales path
- `buchhalter`, `comptable` - Finance path

### Phase 6A by Numbers
- **243 jobs reclassified** from "unsure"
- **5.6% reduction** in unsure count
- **96.9% test accuracy** on 32 Phase 6A keywords

## 💻 One-Liner Tests

```bash
# Show keyword summary
node analyze-keywords.js

# Analyze jobs from file
node analyze-keywords.js jobs.json

# Test imports
node -e "const lib = require('./careerPathInference.cjs'); console.log('Paths:', Object.keys(lib.CAREER_PATH_KEYWORDS).length)"
```

## 📄 Documentation Files

| File | Purpose |
|------|---------|
| `CAREER_KEYWORDS_REUSABLE_SYSTEM.md` | Complete usage guide |
| `PHASE6A_COMPLETION_REPORT.md` | Detailed analysis |
| `PHASE6A_FINAL_SUMMARY.md` | Executive summary |
| `careerPathInference.cjs` | Source (exports keywords) |
| `analyze-keywords.js` | Generic analysis tool |

## 🚀 For Future Phases

**Phase 6B:** Add more keywords using same pattern
```javascript
CAREER_PATH_KEYWORDS['operations-supply-chain'].push('new-keyword');
```

**Phase 7:** NLP context analysis using keyword baseline
```javascript
// Use CAREER_PATH_KEYWORDS as baseline for context matching
```

---

**Status:** ✅ Complete & Ready  
**Last Updated:** Jan 29, 2026

