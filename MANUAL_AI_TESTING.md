# Manual AI Testing Checklist

## 🚀 Quick Manual Tests (5 minutes)

### 1. Basic AI Connection
```bash
# Test if AI is responding
npm run test:ai-simple
```

### 2. Frontend Signup Flow
- [ ] Go to `/signup`
- [ ] Fill out form with test data
- [ ] Submit and check for matches
- [ ] Verify email received

### 3. API Health Check
```bash
# Check if APIs are healthy
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/ai
```

### 4. Database Check
```bash
# Quick database connectivity test
npm run check:jobs
```

## 🧪 Automated AI Testing Suite

### Core Tests (Pick based on needs)

#### Daily Health Check
```bash
npm run test:ai-simple        # 30s - Connection + basic matching
```

#### Quality Assurance
```bash
npm run test:ai-quality       # 2-3min - Relevance, accuracy, diversity
```

#### Data Validation
```bash
npm run test:ai-validation    # 1min - Structure, types, formats
```

#### Complete Suite
```bash
npm run test:ai-comprehensive # 5-10min - All tests in sequence
```

### Advanced Testing
```bash
npm run test:ai-reliability   # Full reliability with MCP integration
```

## 🎯 Automated Tests (Recommended)

### Daily Reliability Test
```bash
npm run test:ai-simple
```

### Full Test Suite (Weekly)
```bash
npm run test:ai-reliability
```

### Before Deployment
```bash
npm run test:ai-simple && npm run test:e2e
```

## 🔍 What to Look For

### ✅ Good Signs
- AI responds within 5 seconds
- Same input gives similar results
- No errors in console
- Matches found for test data

### ❌ Red Flags
- AI timeouts (>30 seconds)
- Inconsistent results for same input
- API errors or rate limits
- No matches found

## 📞 When to Test Manually

- After AI model updates
- Before production deployment
- If users report issues
- After infrastructure changes
- Weekly maintenance check

## 🚨 Emergency Testing

If something feels off:
```bash
# Quick diagnostic
npm run test:ai-simple

# Check logs
tail -f logs/*.log

# Health check
curl http://localhost:3000/api/health/ai
```

**Bottom line:** Let automated tests handle the heavy lifting. Manual testing is for verification, not discovery.