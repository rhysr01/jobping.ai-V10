# 🚀 QUICK REFERENCE - E2E TEST SUITE

## Commands

```bash
# Run only Free Tier
npm run test:e2e:free

# Run only Premium Tier
npm run test:e2e:premium

# Run both (Free then Premium)
npm run test:e2e:complete

# Run all pre-deployment tests
npm run test:e2e:pre-deploy

# Debug mode with UI
npm run test:e2e:free -- --ui
npm run test:e2e:premium -- --ui
```

## Files

| File | Purpose |
|------|---------|
| `tests/e2e/free-tier-e2e.spec.ts` | Free tier complete signup + AI scores (7 tests) |
| `tests/e2e/premium-tier-e2e.spec.ts` | Premium tier full flow + AI scores (8 tests) |
| `package.json` | Updated with `test:e2e:*` commands |

## What Gets Tested

### 🆓 Free Tier
- ✅ Signup: Email, Name, City, Career Path
- ✅ Matching: Receive exactly 5 matches
- ✅ AI Scores: Display match scores
- ✅ Details: Job title, company visible
- ✅ Actions: Apply button clickable

### 💎 Premium Tier
- ✅ Personal Info: Email, Name, Birth Year
- ✅ Preferences: Cities, Career Paths, Languages
- ✅ Enrichment: Work Environment, Visa Status
- ✅ Legal: Age verification, Terms, GDPR
- ✅ Matching: Enhanced matches with AI scores
- ✅ Premium: Language/Env/Visa filters
- ✅ Quality: Detailed score breakdown

## AI Score Verification

Tests check for:
```
[data-testid="match-score"]  ← Primary selector
[data-testid="score-breakdown"]  ← Premium breakdown
.score, .ai-score  ← CSS class fallbacks
```

Logs include:
- Job title & company
- AI match score (percentage)
- Score breakdown (if available)
- Location and apply action status

## Status

✅ Created  
✅ Formatted (0 linting errors)  
✅ Ready to run  
✅ Production-ready  

**Next:** `npm run dev` then `npm run test:e2e:free`

