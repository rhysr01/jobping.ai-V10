# Testing Strategy Guide - Reference Before Writing/Modifying Tests

**📋 REFERENCE THIS GUIDE before writing, running, or modifying tests**

This guide outlines the optimal testing strategy for the JobPing codebase, following proven software engineering principles.

## 🎯 Optimal Testing Pyramid

### 1. **Contract Tests** (Primary Focus - 70% of tests)
**What:** API endpoint contract validation - what the system does, not how
**Why:** Catches integration bugs, validates business logic, ensures reliability
**Examples in codebase:**
- ✅ `/api/user-matches` - User experience validation
- ✅ `/api/dashboard` - System monitoring contracts
- ✅ `/api/signup/free` - User acquisition flows
- ✅ `/api/apply/[jobHash]` - Conversion funnel validation

### 2. **Property-Based Tests** (Strategic - 20% of tests)
**What:** Algorithm validation using generated edge cases
**Why:** Finds bugs traditional unit tests miss
**Examples:**
- ✅ `rule-based-matcher` career path matching
- ✅ Business rule calculations

### 3. **Unit Tests** (Minimal - 5% of tests)
**What:** Pure function testing, utility validation
**Why:** Fast feedback, but limited business value
**Examples:**
- ✅ Utility functions (email senders, data transformers)
- ✅ Business rule calculations

### 4. **Integration Tests** (Minimal - 5% of tests)
**What:** End-to-end user journeys
**Why:** Expensive, slow, brittle - use sparingly
**Examples:**
- ⚠️ Only for critical revenue/business flows
- ❌ Avoid for routine CRUD operations

## 🚫 When to DELETE Tests (Not Fix)

### Criteria for Deletion:

#### 1. **No Business Value**
```typescript
// ❌ DELETE - Tests implementation details
it("should call database with correct SQL", () => {
  expect(mockDb.from).toHaveBeenCalledWith("users");
});

// ✅ KEEP - Tests observable behavior
it("should return user matches for valid request", () => {
  const response = await GET(request);
  expect(response.status).toBe(200);
  expect(response.data.matches).toHaveLength(5);
});
```

#### 2. **Testing Implementation, Not Behavior**
```typescript
// ❌ DELETE - Tests how, not what
it("should use regex for career path matching", () => {
  expect(careerMatch).toMatch(/\\bcareer\\b/i);
});

// ✅ KEEP - Tests business outcome
it("should match tech careers for 'developer' input", () => {
  const result = matchCareer("developer");
  expect(result.matches).toContain("Software Engineer");
});
```

#### 3. **Slow/Flaky Tests**
- Tests that take >500ms consistently
- Tests that fail randomly due to timing/async issues
- Tests that require complex setup/mocking

#### 4. **Duplicate Coverage**
- Multiple tests covering the same business behavior
- Tests that don't add new confidence

#### 5. **Maintenance Burden > Value**
- Tests requiring frequent updates for non-functional changes
- Tests with complex, brittle mocking

## ✅ When to FIX Tests (High Priority)

### Must-Fix Criteria:

#### 1. **Business-Critical Paths**
```typescript
// ✅ FIX - User acquisition broken
it("should create free user account", async () => {
  const response = await signupFree(request);
  expect(response.success).toBe(true);
});
```

#### 2. **Revenue-Generating Flows**
```typescript
// ✅ FIX - Payment processing broken
it("should create Stripe checkout session", async () => {
  const session = await createCheckout(request);
  expect(session.url).toBeDefined();
});
```

#### 3. **Core User Experience**
```typescript
// ✅ FIX - Job matching broken
it("should return relevant job matches", async () => {
  const matches = await findMatches(user);
  expect(matches.length).toBeGreaterThan(0);
});
```

#### 4. **Fast-Failing Validation**
```typescript
// ✅ FIX - Input validation broken
it("should reject invalid email", async () => {
  const response = await apiCall({ email: "invalid" });
  expect(response.status).toBe(400);
});
```

## 🔧 Code Analysis for Test Quality

### Red Flags (Delete/Fix):

#### 1. **Heavy Mocking**
```typescript
// ❌ RED FLAG - Too many mocks = testing mocks, not code
jest.mock("database");
jest.mock("cache");
jest.mock("email");
jest.mock("api-client");
// ... 10+ mocks
```

#### 2. **Testing Private Methods**
```typescript
// ❌ RED FLAG - Implementation testing
it("should call private _validateInput method", () => {
  instance._validateInput(data); // Testing private API
});
```

#### 3. **Async Timing Tests**
```typescript
// ❌ RED FLAG - Brittle timing tests
await wait(1000); // Arbitrary delays
expect(mockCallback).toHaveBeenCalled();
```

#### 4. **Overly Specific Assertions**
```typescript
// ❌ RED FLAG - Tests implementation details
expect(result.exactPropertyName).toBe("exactValue");
expect(mock.method).toHaveBeenCalledWith(exactParams);
```

### Green Flags (Keep/Expand):

#### 1. **Business Outcome Testing**
```typescript
// ✅ GREEN FLAG - Tests what users care about
it("should allow job seekers to find relevant opportunities", async () => {
  const matches = await searchJobs(criteria);
  expect(matches.length).toBeGreaterThan(0);
  expect(matches[0].relevanceScore).toBeGreaterThan(0.7);
});
```

#### 2. **Real Integration Points**
```typescript
// ✅ GREEN FLAG - Tests actual system integration
it("should persist user data to database", async () => {
  await createUser(userData);
  const saved = await getUser(userData.id);
  expect(saved.email).toBe(userData.email);
});
```

#### 3. **Error Scenario Coverage**
```typescript
// ✅ GREEN FLAG - Tests failure modes
it("should handle network failures gracefully", async () => {
  mockNetworkError();
  const result = await apiCall();
  expect(result.retryable).toBe(true);
});
```

## 📊 Test Metrics to Track

### Primary Metrics:
- **Test Execution Time:** < 30 seconds for full suite
- **Test Pass Rate:** > 95% consistently
- **Business Logic Coverage:** > 80% of critical paths
- **Test Maintenance Time:** < 15% of development time

### Secondary Metrics:
- **Lines of Test Code per Production Code:** < 1:1 ratio
- **Test to Code Churn Ratio:** Tests should change less frequently than prod code
- **False Positive Rate:** < 5% (tests failing due to test issues, not code issues)

## 🛠️ Practical Commands

### Running Tests:
```bash
# Full suite (fast feedback)
npm test

# Exclude slow/flaky tests
npm test -- --testPathIgnorePatterns="e2e|integration"

# Run specific business area
npm test -- --testPathPattern="api/(user-matches|signup|apply)"

# Debug failing test
npm test -- --testNamePattern="should return 400" --verbose
```

### Test Maintenance:
```bash
# Find slow tests
npm test -- --verbose | grep -E "[0-9]+\.[0-9]+ s" | sort -nr

# Find tests with many mocks (maintenance burden)
grep -r "jest.mock" __tests__/ | wc -l

# Find tests testing private methods
grep -r "_\." __tests__/ | grep -v "constructor"
```

## 🎯 Decision Framework

### For Each Test, Ask:

1. **Does this test validate a business outcome users care about?**
   - Yes → Keep/Fix
   - No → Delete

2. **Does this test provide confidence the system works end-to-end?**
   - Yes → Keep/Fix
   - No → Delete

3. **Is this test fast (< 100ms) and reliable?**
   - Yes → Keep
   - No → Fix or Delete

4. **Does this test require < 3 mocks?**
   - Yes → Keep
   - No → Refactor or Delete

5. **Would I be confident deploying if only this test passed?**
   - Yes → Keep
   - No → Delete

## 📈 Current Status (Reference Only)

- **Total Tests:** 874
- **Pass Rate:** ~79%
- **Primary Focus:** Contract tests for business-critical APIs
- **Strategy:** Fix business-critical failures, delete low-value tests

## 🔄 Continuous Improvement

### Monthly Review:
1. Run test metrics analysis
2. Identify slow/flaky tests for deletion
3. Review new tests against this guide
4. Update testing strategy based on lessons learned

### When Adding Tests:
1. Reference this guide first
2. Prefer contract tests over unit tests
3. Test business outcomes, not implementation
4. Keep tests fast and reliable

---

**Remember:** Tests should give confidence that the system works for users, not that the code is implemented a certain way. Focus on observable behavior, business value, and edge cases that matter.
