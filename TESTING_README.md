# 🧪 **JobPing Testing Quick Reference**

## 🚀 **Quick Start**

```bash
# Run comprehensive test suite (recommended for CI/CD)
npm run test:quality-gate

# Run all tests
npm run test:comprehensive

# Run specific test categories
npm run test:all                    # Core test suite
npm run test:e2e:visual            # Visual regression
npm run test:e2e:chaos             # Chaos engineering
npm run test:e2e:component         # Component testing
npm run test:production-engine     # AI matching validation
```

## 📊 **Test Categories**

| Category | Tests | Purpose | Run Time |
|----------|-------|---------|----------|
| **Visual Regression** | 84 tests | UI consistency | ~2-3 min |
| **Chaos Engineering** | 42 tests | System resilience | ~5-7 min |
| **Component Testing** | 36 tests | UI components | ~1-2 min |
| **E2E User Journeys** | 154 tests | Complete flows | ~8-12 min |
| **API Integration** | 48 tests | Service contracts | ~2-3 min |
| **Unit Tests** | Jest | Business logic | ~30 sec |

## 🎯 **Common Scenarios**

### **Before Committing Code**
```bash
# Fast feedback loop
npm run test:e2e:component

# If changing UI
npm run test:e2e:visual

# If changing business logic
npm run test
```

### **After UI Changes**
```bash
# Update visual baselines if changes are intentional
npm run test:e2e:visual:update

# Verify no regressions
npm run test:e2e:visual
```

### **Before Production Deployment**
```bash
# Full quality assurance
npm run test:quality-gate

# Includes: tests + linting + type checking
```

### **Investigating Failures**
```bash
# Get automated analysis
npm run test:failure-analysis

# Start MCP server for manual investigation
npm run mcp:start
```

## 🔧 **Environment Setup**

### **Required Environment Variables**
```bash
# For MCP integration
GITHUB_TOKEN=your_github_token
SENTRY_AUTH_TOKEN=your_sentry_token
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
BRAVE_API_KEY=your_brave_key

# For Vercel integration
VERCEL_ACCESS_TOKEN=your_vercel_token
```

### **First Time Setup**
```bash
# Install dependencies
npm ci

# Create visual baselines
npm run test:e2e:visual:update

# Verify MCP configuration
npm run mcp:start
```

## 🐛 **Troubleshooting**

### **Visual Tests Failing**
```bash
# Check for legitimate UI changes
npm run test:e2e:visual

# Update baselines if changes are expected
npm run test:e2e:visual:update
```

### **MCP Server Issues**
```bash
# Check environment variables
npm run verify:env

# Validate MCP configuration
npm run mcp:test-env-validation
```

### **Slow Tests**
- Use `npm run test:e2e:component` for fast feedback
- Run tests in parallel with `--shard` flag
- Check for network/API timeouts

### **Flaky Tests**
- Tests are designed with retries (2 in CI, 0 locally)
- Check for race conditions or timing issues
- Use `npm run test:e2e:ui` for interactive debugging

## 📈 **Quality Metrics**

### **Expected Results**
- ✅ **Visual Tests**: 100% baseline compliance
- ✅ **Unit Tests**: >80% strategic coverage
- ✅ **E2E Tests**: >95% pass rate (environmental factors excluded)
- ✅ **Performance**: <2s signup, <3s matching
- ✅ **Chaos Recovery**: 100% graceful degradation

### **CI/CD Quality Gates**
- All tests must pass
- No visual regressions
- TypeScript compilation successful
- Code linting passes
- Bundle analysis within limits

## 🤖 **MCP Automation Features**

### **Automated Issue Creation**
When tests fail, MCP automatically:
- Analyzes failure patterns
- Correlates with production errors
- Creates GitHub issues with full context
- Assigns appropriate severity levels
- CCs relevant team members

### **Available MCP Tools**
- **GitHub**: Issue creation, recent issues, search
- **Sentry**: Error analysis, pattern detection
- **Supabase**: Database monitoring, user queries
- **Vercel**: Deployment monitoring, logs
- **Brave Search**: Research, documentation
- **Playwright**: Screenshots, design analysis

## 📚 **Advanced Usage**

### **Running Specific Browsers**
```bash
# Chrome only (fastest)
npx playwright test --project chromium

# All browsers
npx playwright test

# Debug mode
npx playwright test --ui
```

### **Performance Testing**
```bash
# API performance
npm run test:e2e:performance

# Bundle analysis
npm run analyze-bundle
```

### **Security Testing**
```bash
# Input validation
npm run test:security

# SQL injection, XSS prevention
npm run test:security
```

### **Database Testing**
```bash
# Integrity checks
npm run test:database-integrity

# Migration validation
npm run supabase db reset
```

## 🎯 **Best Practices**

### **Writing Tests**
- **Realistic Data**: Use production-like test scenarios
- **Independent Tests**: No shared state between tests
- **Descriptive Names**: Clear test descriptions
- **Performance First**: Optimize for speed and reliability

### **Visual Regression**
- **Update Baselines**: Only after intentional UI changes
- **Review Changes**: Always verify visual differences
- **Thresholds**: Use appropriate tolerance levels (0.1 = 10%)

### **Chaos Engineering**
- **Safe Failures**: Tests shouldn't break production systems
- **Realistic Scenarios**: Based on actual failure patterns
- **Recovery Validation**: Always test recovery mechanisms

### **MCP Integration**
- **Environment Variables**: Keep tokens secure and up-to-date
- **Issue Templates**: Use automated issue creation for consistency
- **Monitoring**: Regular checks of MCP server health

---

## 🚀 **Need Help?**

- 📖 **Full Documentation**: `docs/testing.md`
- 🐛 **Report Issues**: Use automated MCP issue creation
- 💬 **Team Chat**: Ask in #testing channel
- 📊 **Metrics**: Check testing dashboard for trends

**Happy Testing!** 🎉