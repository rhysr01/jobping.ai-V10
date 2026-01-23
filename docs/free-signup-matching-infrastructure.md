# Free Signup & Matching Infrastructure

**Date**: January 23, 2026  
**Status**: ✅ Complete Documentation

## Architecture Overview

Based on technical reference analysis, here's the complete infrastructure for free signup and matching:

### Free Signup Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FREE SIGNUP PIPELINE                          │
└─────────────────────────────────────────────────────────────────┘

1. Frontend Form (SignupFormFree.tsx)
   ├─ Multi-step form (3 steps)
   ├─ Client-side validation
   └─ Form persistence (localStorage)

2. API Route (/api/signup/free)
   ├─ Rate Limiting (10 requests/hour/IP)
   ├─ Input Validation (Zod schema)
   ├─ User Existence Check
   ├─ User Creation (Minimal → Update pattern)
   ├─ Job Fetching (Country-level → Fallbacks)
   ├─ Matching Engine (SignupMatchingService)
   └─ Response (Success/Error with requestId)

3. Matching Engine (SignupMatchingService)
   ├─ PrefilterService (Location/Career/Visa filtering)
   ├─ ConsolidatedMatchingEngine (AI + Rule-based)
   └─ Match Storage (Database persistence)

4. Frontend Success Handling
   ├─ Cookie Setting (Session management)
   ├─ Redirect to /matches
   └─ Match Display
```

### Matching Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              FREE TIER MATCHING PIPELINE                        │
└─────────────────────────────────────────────────────────────────┘

User Input → Validation → Hard Filtering → AI Matching → Fallback → Results
     ↓           ↓            ↓            ↓           ↓          ↓
  Raw Data   Sanitize    Location/Career  GPT-4      Rule-based  5 Jobs
             GDPR        Visa Filtering   Embeddings Algorithm
```

#### Stage 1: Hard Filtering (PrefilterService)
- **Location Matching**: City name exact match or country containment
- **Career Path**: Category matching with synonym expansion
- **Visa Requirements**: Explicit visa sponsorship filtering
- **Freshness**: Jobs posted within last 30 days (free tier)
- **Quality Gates**: Minimum description length, valid URLs

#### Stage 2: AI Matching (ConsolidatedMatchingEngine)
- **Semantic Similarity**: OpenAI embeddings comparison
- **Context Awareness**: User preferences + job requirements
- **Confidence Scoring**: 0-100 confidence levels
- **Fallback Triggers**: API failures or low confidence scores

#### Stage 3: Rule-Based Fallback
- **Experience Matching**: Entry-level vs senior filtering
- **Skills Matching**: Keyword-based relevance scoring
- **Company Reputation**: Established company bonus points
- **Geographic Proximity**: Regional preference matching

### Infrastructure Components

#### 1. API Layer (`/app/api/signup/free/route.ts`)
- **Runtime**: Vercel serverless functions
- **Rate Limiting**: Redis-backed (10 requests/hour/IP)
- **Error Handling**: Structured error responses with requestId
- **Logging**: Comprehensive request/response logging
- **Sentry Integration**: All error points tracked

#### 2. Matching Service (`SignupMatchingService`)
- **Location**: `utils/services/SignupMatchingService.ts`
- **Purpose**: Consolidated matching logic for both free & premium
- **Config**: Tier-aware configurations (`free` vs `premium_pending`)
- **Methods**:
  - `getConfig(tier)` - Get tier-specific matching config
  - `runMatching(userPrefs, config)` - Execute matching pipeline
  - `checkExistingMatches(email, tier)` - Prevent duplicates

#### 3. Prefilter Service (`PrefilterService`)
- **Location**: `utils/matching/core/prefilter.service.ts`
- **Purpose**: Hard filtering before AI matching
- **Filters**:
  - Location (city variations, country matching)
  - Career path (synonym expansion)
  - Visa status (sponsorship requirements)
  - Job freshness (30 days for free)
  - Quality gates (description length, valid URLs)

#### 4. Matching Engine (`ConsolidatedMatchingEngine`)
- **Location**: `lib/matching/engine.ts`
- **Purpose**: AI + Rule-based matching coordination
- **Features**:
  - GPT-4 semantic similarity
  - Embedding-based matching
  - Fallback rule-based algorithm
  - Confidence scoring
  - Diversity distribution

#### 5. Database Layer (Supabase)
- **Database**: PostgreSQL via Supabase
- **Security**: Row Level Security (RLS) policies
- **Tables**:
  - `users` - User profiles and preferences
  - `jobs` - Job listings with embeddings
  - `matches` - User-job match records
- **Caching**: Redis for session and API caching

### Data Flow

#### Free Signup Request Flow
```
1. User submits form → SignupFormFree.tsx
2. Client validation → useEmailValidation, form checks
3. API call → POST /api/signup/free
4. Rate limit check → Redis-based limiting
5. Input validation → Zod schema validation
6. User check → Supabase query (existing user?)
7. User creation → Minimal insert → Update pattern
8. Job fetching → Country-level → Fallback strategies
9. Matching → SignupMatchingService.runMatching()
10. Match storage → Database persistence
11. Cookie setting → Session management
12. Response → Success with matchCount
13. Redirect → /matches page
```

#### Matching Execution Flow
```
1. User preferences extracted
2. PrefilterService filters jobs:
   - Location matching (city/country)
   - Career path matching
   - Visa status filtering
   - Freshness filtering (30 days)
3. ConsolidatedMatchingEngine processes:
   - AI matching (if available)
   - Embedding similarity
   - Fallback rule-based matching
4. Results ranked and filtered:
   - Confidence scoring
   - Diversity distribution
   - Top 5 matches selected
5. Matches stored in database
6. Results returned to API
```

### Error Handling Points

#### Server-Side (API Route)
1. **Rate Limit Exceeded** - 10 requests/hour/IP
2. **Validation Failed** - Zod schema validation
3. **User Check Error** - Database connection issues
4. **User Creation Failed** - Database constraints
5. **User Update Failed** - Schema cache issues
6. **No Jobs Found** - Empty database or strict filtering
7. **No Jobs for Matching** - All jobs filtered out
8. **No Matches Found** - Matching engine too strict

#### Client-Side (React Component)
1. **Client-Side Validation** - Form field validation
2. **API Error** - Network/server errors
3. **Unexpected Error** - Non-ApiError exceptions

### Performance Considerations

#### Caching Strategy
- **Job Embeddings**: Pre-computed semantic embeddings (24h cache)
- **User Matches**: Recent matches cached (5min cache)
- **Session Data**: Redis-backed session storage

#### Batch Processing
- **User Processing**: Processed individually (not batched for signup)
- **Job Fetching**: Country-level queries for efficiency
- **Matching**: Single user matching (not batch)

#### Optimization
- **Database Queries**: Optimized with proper indexes
- **AI Calls**: Rate-limited and cached
- **Response Time**: Target <5s for free signup

### Monitoring & Observability

#### Sentry Integration
- All error points tracked with tags
- Request ID tracking for debugging
- Context data (email, cities, careerPath)

#### Logging
- `apiLogger` for structured logging
- Request ID in all logs
- Performance metrics tracking

#### Metrics
- Signup success rate
- Matching success rate
- Average response time
- Error rates by type

### Configuration

#### Free Tier Limits
- **Matches**: 5 instant matches
- **Job Freshness**: 30 days
- **Rate Limit**: 10 signups/hour/IP
- **Session**: 30 days cookie expiration

#### Matching Config
```typescript
{
  tier: "free",
  matchCount: 5,
  jobFreshnessDays: 30,
  useAI: true,
  fallbackEnabled: true,
  diversityEnabled: false
}
```

### Testing Strategy

#### Production-First Testing
- Tests use actual `ConsolidatedMatchingEngine`
- No mocks for core matching logic
- Real database queries (test environment)

#### Test Coverage
- **E2E Tests**: Complete signup flow
- **API Tests**: Route handler validation
- **Matching Tests**: Engine validation
- **Error Tests**: Error handling paths

### Known Issues & Fixes

#### ✅ Fixed Issues
1. **BrandIcons SSR Error** - Added `"use client"` directive
2. **setFormData Undefined** - Added SSR guards
3. **City Normalization** - Fixed array handling
4. **Body Already Read** - Request cloning (see fix below)

#### ⚠️ Remaining Issues
1. **Body Already Read** - Fixed with request cloning
2. **React Undefined** - Needs investigation
3. **Channel Closed** - Low priority, monitor

---

## Body Already Read Error Fix

**Issue**: Request body being read multiple times causing "Body is unusable" error

**Root Cause**: Next.js error handlers or middleware trying to read body after it's consumed

**Fix Applied**: Clone request before reading body to preserve original for error handling

**Location**: `app/api/match-users/handlers/index.ts`

**Implementation**:
```typescript
// Clone request to prevent "Body already read" errors
const clonedReq = req.clone();

// Read from cloned request
body = await clonedReq.json();
```

This ensures:
- Original request remains available for error handlers
- Body can be read once without errors
- Error logging can access body if needed
