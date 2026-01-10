# Production AI Testing Suite

This testing suite validates the **real production AI matching engine** (ConsolidatedMatchingEngine) to ensure it delivers exactly what users experience.

## 🎯 What It Tests

- **Production Code Path**: Tests the actual `ConsolidatedMatchingEngine.performMatching()` method
- **Hard Filtering**: Location, visa, language, and career path filtering
- **Match Counts**: Free users get 5 matches, Premium get appropriate volume
- **Caching**: Production LRU caching with shared cache instances
- **Circuit Breaker**: Error handling and retry logic
- **Validation**: Post-AI quality checks and hallucination prevention

## 🚀 Features

- **Connection Stability Testing**: Validates AI service connectivity
- **Matching Consistency**: Tests result consistency across multiple requests
- **Performance Monitoring**: Measures response times and latency
- **Error Handling**: Validates graceful error management
- **Cache Behavior**: Tests caching effectiveness
- **MCP Integration**: Enhanced accuracy with external validation

## 🛠️ MCP Integration

The script integrates with multiple MCP servers for comprehensive testing:

### 🔍 **Supabase MCP**
- Database state validation
- Table statistics checking
- User/job data integrity verification

### 🚨 **Sentry MCP**
- Error monitoring during testing
- Real-time error detection
- Test impact assessment

### 🔍 **BraveSearch MCP**
- Research of AI testing best practices
- Latest industry standards validation
- Technical solution discovery

### 📸 **Puppeteer MCP**
- Visual test result capture
- Screenshot documentation
- Automated report generation

## 📋 Prerequisites

### Required Environment Variables

```bash
# Core AI Service
OPENAI_API_KEY=your_openai_api_key

# Database Access
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MCP Servers (Optional - enhances testing accuracy)
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=your_project_slug
BRAVE_API_KEY=your_brave_api_key
```

## 🏃‍♂️ Running Tests

### Quick Start (Mock Mode)
```bash
npm run test:ai-reliability
```
Runs in mock mode if environment variables are missing - perfect for development testing.

### Full Testing (Production)
```bash
# Set all environment variables first
export OPENAI_API_KEY="sk-..."
export NEXT_PUBLIC_SUPABASE_URL="https://..."
# ... set other MCP variables

npm run test:ai-reliability
```

### CI/CD Integration
```bash
# Add to your CI pipeline
npm run test:ai-reliability || exit 1
```

## 📊 Test Results

### Sample Output
```
🚀 Starting AI Reliability Test Suite with MCP Integration
============================================================

🔍 Validating database state with Supabase MCP...
   ✅ Database state validated via MCP
   📊 Database Table Statistics:
   **users:**
   • Count: 1,247
   • Latest Record: 1/9/2026, 3:27:32 PM

🚨 Checking for errors during testing with Sentry MCP...
   ✅ No errors detected in Sentry during testing period

🔍 Researching AI testing best practices with BraveSearch MCP...
   ✅ AI testing best practices researched:
   1. Implement comprehensive test suites covering edge cases
   2. Monitor model performance metrics continuously
   3. Validate output consistency across similar inputs

1️⃣  Testing AI Connection Stability...
   ✅ Connection test 1: 143ms
   ✅ Connection test 2: 96ms
   ✅ Connection test 3: 75ms
   ✅ Connection test 4: 130ms
   ✅ Connection test 5: 74ms

2️⃣  Testing AI Matching Consistency...
   ✅ Consistency test 1: 2 matches in 130ms
   ✅ Consistency test 2: 1 matches in 162ms
   ✅ Consistency test 3: 2 matches in 226ms
   [ ... 7 more tests ... ]
   📊 Match count consistency: avg=1.7, stdDev=0.46

3️⃣  Testing AI Performance Metrics...
   ✅ Performance test: 1250ms (acceptable)

4️⃣  Testing AI Error Handling...
   ✅ Error handling test: Correctly handled error in 50ms

5️⃣  Testing AI Cache Behavior...
   ✅ Cache test: 1250ms → 150ms (cache working)

📸 Capturing test results with Puppeteer MCP...
   ✅ Test results screenshot captured

============================================================
📊 AI RELIABILITY TEST RESULTS
============================================================
⏱️  Total Duration: 8.5s
✅ Passed Tests: 24/24
❌ Failed Tests: 0/24
📈 Success Rate: 100%
⏱️  Average Test Duration: 354ms

🏥 AI Health Status: HEALTHY
   AI performing well: 24 requests, 0.00% error rate

🎯 OVERALL RESULT: ✅ PASSED
============================================================
```

## 🔧 Test Categories

### 1. **Connection Stability** 🔗
- Tests AI service connectivity
- Measures response times
- Validates API availability

### 2. **Matching Consistency** 🎯
- Runs same query multiple times
- Analyzes result variance
- Measures standard deviation

### 3. **Performance Metrics** ⚡
- Response time validation
- Timeout handling
- Performance thresholds

### 4. **Error Handling** 🛡️
- Invalid input testing
- Error recovery validation
- Graceful failure handling

### 5. **Cache Behavior** 💾
- Cache hit/miss validation
- Performance improvement measurement
- Consistency preservation

### 6. **MCP Validation** 🤖
- Database state verification
- Error monitoring integration
- Best practices research

## 📈 Metrics & Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Success Rate | > 95% | Percentage of tests passing |
| Response Time | < 30s | Maximum acceptable response time |
| Consistency StdDev | < 1.0 | Match count variation tolerance |
| Cache Improvement | > 50% | Minimum cache performance gain |
| Error Rate | < 5% | Maximum acceptable error rate |

## 🚨 Failure Scenarios

### Common Issues & Solutions

#### ❌ Connection Failures
```
Cause: OPENAI_API_KEY not set or invalid
Solution: Set valid OpenAI API key
```

#### ❌ Database Validation Errors
```
Cause: Supabase credentials missing
Solution: Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

#### ❌ Performance Issues
```
Cause: High latency or timeouts
Solution: Check network connectivity, consider rate limiting
```

#### ❌ Cache Ineffectiveness
```
Cause: Cache TTL expired or cache miss
Solution: Adjust cache configuration or investigate cache invalidation
```

## 🔄 Automation & Monitoring

### Scheduled Testing
```bash
# Add to cron for daily testing
0 2 * * * cd /path/to/jobping && npm run test:ai-reliability
```

### Integration with CI/CD
```yaml
# .github/workflows/ai-reliability.yml
name: AI Reliability Testing
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ai-reliability
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          # Add other MCP secrets
```

### Alerting Integration
```typescript
// Example: Slack alerting on failures
if (report.overallSuccess === false) {
  await sendSlackAlert({
    channel: '#ai-reliability',
    message: `🚨 AI Reliability Test Failed: ${report.summary.failedTests}/${report.summary.totalTests} tests failed`,
    details: report
  });
}
```

## 🏗️ Architecture

```
AI Reliability Testing Suite
├── Core Tests
│   ├── Connection Stability
│   ├── Matching Consistency
│   ├── Performance Metrics
│   ├── Error Handling
│   └── Cache Behavior
├── MCP Integration
│   ├── Supabase MCP (Database validation)
│   ├── Sentry MCP (Error monitoring)
│   ├── BraveSearch MCP (Best practices)
│   └── Puppeteer MCP (Visual reporting)
└── Reporting
    ├── Console Output
    ├── Structured Results
    ├── Screenshot Capture
    └── Health Metrics
```

## 🔒 Security Considerations

- **API Keys**: Never commit sensitive keys to version control
- **Environment Variables**: Use secure secret management
- **Test Data**: Use anonymized data for testing
- **Access Control**: Limit test execution to authorized personnel
- **Audit Logging**: Log all test executions for compliance

## 📚 Troubleshooting

### Environment Setup Issues
```bash
# Check environment variables
env | grep -E "(OPENAI|SENTRY|BRAVE|SUPABASE)"

# Test individual MCP servers
npm run mcp:start
# Then use Claude Desktop to test MCP tools
```

### Performance Issues
```bash
# Enable verbose logging
DEBUG=* npm run test:ai-reliability

# Test network connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Cache Issues
```bash
# Clear AI cache if needed
# (Implement cache clearing in your AI service)
```

## 🎯 Best Practices

1. **Run tests regularly** - Daily in production, before deployments
2. **Monitor trends** - Track performance metrics over time
3. **Fail fast** - Stop deployment if AI reliability drops
4. **Document failures** - Keep records of issues and resolutions
5. **Continuous improvement** - Update test thresholds based on learnings

## 📞 Support

For issues with the AI reliability testing suite:

1. Check this documentation first
2. Review test output for specific error messages
3. Validate environment variable configuration
4. Test MCP servers individually
5. Check the main project issues for known problems

---

**Happy testing!** 🧪 Ensure your AI delivers reliable results every time.