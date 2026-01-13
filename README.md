# JobPing

AI-powered job matching platform built with Next.js, TypeScript, and Supabase.

## Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Database      │
│   (Next.js)     │◄──►│   (Vercel)      │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Authentication │    │ • PostgreSQL   │
│ • TypeScript    │    │ • Job Matching  │    │ • RLS Policies  │
│ • Tailwind CSS  │    │ • Email Delivery│    │ • Vector Embed. │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Scrapers      │    │   Cron Jobs     │    │   AI Service    │
│   (Node.js)     │    │   (Vercel)      │    │   (OpenAI)      │
│                 │    │                 │    │                 │
│ • Job Sources   │    │ • Email Delivery│    │ • GPT-4        │
│ • Data Cleaning │    │ • Health Checks │    │ • Embeddings    │
│ • Deduplication │    │ • Maintenance   │    │ • Similarity    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack

#### Frontend
- **Next.js 14** - App Router, Server Components, API Routes
- **React 19** - Latest React with concurrent features
- **TypeScript** - Strict type checking
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations and transitions

#### Backend & Infrastructure
- **Supabase** - PostgreSQL database with Row Level Security
- **Vercel** - Hosting, cron jobs, edge functions
- **Redis** - Caching and distributed locks
- **Node.js 18+** - Server runtime

#### AI & ML
- **OpenAI GPT-4** - Job matching and similarity scoring
- **Vector Embeddings** - Semantic job matching
- **Custom Algorithms** - Early-career job filtering

#### External Services
- **Resend** - Email delivery (99.5% success rate)
- **Stripe** - Subscription payments
- **PostHog** - User analytics and session replay
- **Sentry** - Error tracking and monitoring
- **Google Analytics 4** - Web analytics

#### Development Tools
- **Biome** - Linting and formatting
- **Jest** - Unit and integration testing
- **Playwright** - E2E testing
- **tsx** - TypeScript execution

### Core Components

#### 1. Job Scraping System
- **Multi-source aggregation**: Arbeitnow, Careerjet, Jooble, Reed, Adzuna
- **Data normalization**: Location standardization, deduplication
- **AI labeling**: Automatic job categorization and requirements extraction
- **Real-time processing**: Continuous job feed updates

#### 2. AI Matching Engine
- **Semantic similarity**: Vector embeddings for job-user matching
- **Multi-factor scoring**: Skills, location, experience, preferences
- **Confidence thresholds**: 85-97% match accuracy
- **Feedback learning**: User responses improve future matches

#### 3. Email Delivery System
- **Template rendering**: HTML emails optimized for Gmail/Outlook
- **Cron automation**: Scheduled delivery (Mon/Wed/Fri for premium)
- **Engagement tracking**: Open rates, click tracking, unsubscribes
- **A/B testing**: Template optimization and personalization

#### 4. User Management
- **Dual-tier system**: Free (5 matches) + Premium (€5/month)
- **Preference collection**: Skills, locations, career paths
- **Subscription management**: Stripe integration with webhooks
- **GDPR compliance**: Data portability, consent management

#### 5. Monitoring & Analytics
- **Performance monitoring**: Response times, error rates, uptime
- **Business metrics**: Conversion rates, engagement scores
- **System health**: Database connections, API availability
- **Security auditing**: Rate limiting, authentication logs

## API Reference

### Authentication

All API endpoints require authentication via HMAC signatures or API keys.

```typescript
// HMAC Authentication Example
const signature = crypto
  .createHmac('sha256', process.env.API_SECRET)
  .update(`${userLimit}${jobLimit}${timestamp}`, 'utf8')
  .digest('hex');

const response = await fetch('/api/match-users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userLimit: 100,
    jobLimit: 500,
    signature,
    timestamp: Date.now()
  })
});
```

### Core Endpoints

#### Job Matching (`/api/match-users`)
**Method:** `POST`

Processes batch job matching for all active users.

**Request Body:**
```json
{
  "userLimit": 100,
  "jobLimit": 500,
  "signature": "hmac_signature",
  "timestamp": 1703123456789
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "matches": [
        {
          "jobId": 123,
          "similarity": 0.92,
          "confidence": "high",
          "reasoning": "Strong match in software engineering and Berlin location"
        }
      ],
      "processingTime": 1250
    }
  ],
  "totalUsers": 42,
  "totalMatches": 156
}
```

**Rate Limiting:** 1 request per 30 seconds (global lock)

#### User Registration (`/api/signup`)
**Method:** `POST`

Creates new user account and sends verification email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "preferences": {
    "targetCities": ["Berlin", "Munich"],
    "roles": ["Software Engineer", "Frontend Developer"],
    "workEnvironment": "hybrid",
    "startDate": "2024-06-01"
  }
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid",
  "verificationToken": "token",
  "message": "Please check your email to verify your account"
}
```

#### Email Verification (`/api/auth/verify`)
**Method:** `POST`

Verifies user email address.

```json
{
  "token": "verification_token"
}
```

#### User Preferences (`/api/preferences`)
**Method:** `POST`

Updates user job matching preferences.

```json
{
  "userId": "uuid",
  "preferences": {
    "skills": ["React", "TypeScript", "Node.js"],
    "industries": ["Technology", "FinTech"],
    "companySize": "startup",
    "careerKeywords": "junior software engineer"
  }
}
```

#### Email Delivery (`/api/send-emails`)
**Method:** `POST`

Triggers email delivery for matched jobs.

```json
{
  "userIds": ["uuid1", "uuid2"],
  "matchIds": [123, 456],
  "deliveryType": "premium" // or "free"
}
```

#### Stripe Webhooks (`/api/webhooks/stripe`)
**Method:** `POST`

Handles Stripe subscription events.

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Supported Events:**
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`

#### Health Check (`/api/health`)
**Method:** `GET`

System health monitoring endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-13T10:30:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "email": "healthy",
    "ai": "healthy"
  },
  "version": "1.0.0"
}
```

### Cron Endpoints

#### Daily Scraping (`/api/cron/daily-scrape`)
**Method:** `GET`

Executes daily job data scraping from all sources.

- **Schedule:** Every 2 hours
- **Sources:** Arbeitnow, Careerjet, Jooble, Reed, Adzuna
- **Processing:** Deduplication, AI labeling, embedding generation

#### Email Delivery (`/api/cron/email-delivery`)
**Method:** `GET`

Sends weekly match emails to premium users.

- **Schedule:** Monday, Wednesday, Friday at 9:00 AM CET
- **Template:** Personalized HTML with match recommendations
- **Tracking:** Open rates, click tracking, engagement scoring

#### User Cleanup (`/api/cron/cleanup-free-users`)
**Method:** `GET`

Removes inactive free users after 30-day expiration.

- **Schedule:** Daily at 2:00 AM CET
- **Criteria:** Free tier users with no engagement > 30 days
- **Process:** Data anonymization, account deactivation

#### Health Monitoring (`/api/cron/check-link-health`)
**Method:** `GET`

Validates job URLs and updates active status.

- **Schedule:** Every 6 hours
- **Checks:** HTTP status, content validation
- **Updates:** Job active/inactive status in database

### Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "ERROR_TYPE",
  "message": "Human-readable error message",
  "details": {
    "field": "validation_error_details"
  },
  "requestId": "uuid"
}
```

**Common Error Types:**
- `VALIDATION_ERROR` - Invalid request data
- `AUTHENTICATION_FAILED` - Invalid credentials
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `DATABASE_ERROR` - Database connectivity issues
- `EXTERNAL_SERVICE_ERROR` - Third-party API failures

## Database Schema

### Core Tables

#### `users` Table
Primary user data and subscription management.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  verification_token_expires TIMESTAMPTZ,

  -- Subscription fields
  subscription_active BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,

  -- Email delivery
  email_count INTEGER DEFAULT 0,
  last_email_sent TIMESTAMPTZ,
  last_email_opened TIMESTAMPTZ,
  last_email_clicked TIMESTAMPTZ,
  email_engagement_score DECIMAL(3,2) DEFAULT 0.0,
  email_phase TEXT DEFAULT 'onboarding',
  delivery_paused BOOLEAN DEFAULT false,

  -- User preferences (legacy fields)
  target_cities TEXT[] DEFAULT '{}',
  roles_selected TEXT[] DEFAULT '{}',
  languages_spoken TEXT[] DEFAULT '{}',
  career_path TEXT,
  work_environment TEXT,
  entry_level_preference TEXT,
  visa_status TEXT,
  start_date DATE,

  -- Enhanced preferences (premium)
  skills TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  company_size_preference TEXT,
  career_keywords TEXT,

  -- Legacy compatibility
  company_types TEXT[] DEFAULT '{}',
  professional_expertise TEXT,

  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_complete BOOLEAN DEFAULT false,
  re_engagement_sent BOOLEAN DEFAULT false,
  last_engagement_date TIMESTAMPTZ
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

#### `jobs` Table
Job listings from various sources with AI processing.

```sql
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY,
  job_hash TEXT UNIQUE NOT NULL,
  job_hash_score INTEGER DEFAULT 0,

  -- Job details
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_name TEXT,
  description TEXT,
  location TEXT,
  location_name TEXT,
  city TEXT,
  country TEXT,
  region TEXT,
  work_location TEXT,

  -- Job metadata
  platform TEXT,
  source TEXT NOT NULL,
  board TEXT,
  job_url TEXT,
  posted_at TIMESTAMPTZ,
  original_posted_date DATE,

  -- AI processing
  ai_labels TEXT[] DEFAULT '{}',
  experience_required TEXT,
  work_environment TEXT,
  language_requirements TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',

  -- Status and filtering
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  is_graduate BOOLEAN DEFAULT false,
  is_internship BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,

  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  scrape_timestamp TIMESTAMPTZ,
  scraper_run_id TEXT,
  filtered_reason TEXT,
  fingerprint TEXT,
  dedupe_key TEXT,

  -- Language detection
  lang TEXT,
  lang_conf DECIMAL(5,4)
);

-- Indexes for performance
CREATE INDEX idx_jobs_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX idx_jobs_location ON jobs(city, country);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_ai_labels ON jobs USING gin(ai_labels);
CREATE INDEX idx_jobs_hash ON jobs(job_hash);
```

#### `job_matches` Table
AI-generated job recommendations for users.

```sql
CREATE TABLE job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  job_id INTEGER NOT NULL REFERENCES jobs(id),

  -- Matching data
  similarity_score DECIMAL(5,4) NOT NULL,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  match_reasoning TEXT,
  match_factors JSONB,

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sent', 'viewed', 'applied', 'expired')),
  email_sent_at TIMESTAMPTZ,
  email_delivery_id TEXT,

  -- User feedback
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
  feedback_timestamp TIMESTAMPTZ,

  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  batch_id TEXT,
  processing_time_ms INTEGER,

  UNIQUE(user_id, job_id, created_at::date)
);

-- Indexes for matching performance
CREATE INDEX idx_job_matches_user ON job_matches(user_id, created_at DESC);
CREATE INDEX idx_job_matches_score ON job_matches(similarity_score DESC);
CREATE INDEX idx_job_matches_status ON job_matches(status);
```

#### `email_deliveries` Table
Email delivery tracking and analytics.

```sql
CREATE TABLE email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Email details
  email_type TEXT NOT NULL CHECK (email_type IN ('match', 'welcome', 'onboarding', 'reengagement')),
  subject TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  match_ids INTEGER[] DEFAULT '{}',

  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'complained')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,

  -- Engagement tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,

  -- Provider data
  provider_message_id TEXT,
  provider_response JSONB,

  -- System fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  batch_id TEXT,
  template_version TEXT DEFAULT 'v1'
);

-- Indexes for analytics
CREATE INDEX idx_email_deliveries_user ON email_deliveries(user_id, sent_at DESC);
CREATE INDEX idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX idx_email_deliveries_type ON email_deliveries(email_type);
```

### System Tables

#### `api_keys` Table
API key management for external integrations.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  key_hash TEXT UNIQUE NOT NULL,
  description TEXT,
  tier TEXT DEFAULT 'free',
  disabled BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id),
  path TEXT,
  ip_address INET,
  used_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Relationships

```
users (1) ──── (many) job_matches (many) ──── (1) jobs
   │                                               │
   │                                               │
   └─── (many) email_deliveries                   │
           │                                      │
           │                                      │
           └─── (many) api_key_usage ──── (1) api_keys
```

### Performance Optimizations

- **Composite indexes** on frequently queried fields
- **GIN indexes** for array columns (skills, labels, etc.)
- **Partial indexes** for active records only
- **Foreign key constraints** with cascade deletes
- **Row Level Security** policies for data isolation
- **Connection pooling** via singleton pattern

## Job Scraping System

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Job Sources   │───►│   Scrapers      │───►│   Processing    │
│                 │    │   (Node.js)     │    │   Pipeline      │
│ • Arbeitnow     │    │                 │    │                 │
│ • Careerjet     │    │ • Data Cleaning │    │ • Deduplication │
│ • Jooble        │    │ • Normalization │    │ • AI Labeling   │
│ • Reed          │    │ • Validation    │    │ • Embeddings    │
│ • Adzuna        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Scraper Implementation

Each scraper follows a standardized pattern:

```javascript
// scrapers/arbeitnow.cjs
const { createClient } = require("@supabase/supabase-js");
const {
  processIncomingJob,
  makeJobHash,
  classifyEarlyCareer
} = require("./shared/processor.cjs");

async function scrapeArbeitnow() {
  const supabase = createClient(url, key);

  // 1. Fetch jobs from API
  const jobs = await fetchFromArbeitnow();

  // 2. Process each job
  for (const jobData of jobs) {
    try {
      // Generate unique hash
      const jobHash = makeJobHash(jobData);

      // Check for duplicates
      const existing = await supabase
        .from('jobs')
        .select('id')
        .eq('job_hash', jobHash)
        .single();

      if (existing.data) continue;

      // AI-powered processing
      const processedJob = await processIncomingJob(jobData);

      // Insert into database
      await supabase.from('jobs').insert(processedJob);

    } catch (error) {
      console.error(`Failed to process job:`, error);
    }
  }
}
```

### Data Processing Pipeline

#### 1. Job Normalization
- **Location standardization**: City/country mapping
- **Company name cleaning**: Remove suffixes, standardize formats
- **Date parsing**: Handle various date formats
- **Salary extraction**: Parse compensation data

#### 2. AI Labeling
```javascript
// AI-powered job categorization
const labels = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{
    role: "system",
    content: `Categorize this job for early-career professionals.
    Return JSON with: skills[], industries[], experience_level, work_environment`
  }, {
    role: "user",
    content: job.description
  }]
});
```

#### 3. Deduplication
- **Hash-based deduplication**: SHA-256 of title + company + location
- **Similarity matching**: Fuzzy matching for near-duplicates
- **Temporal filtering**: Prefer newer job postings

#### 4. Embedding Generation
```javascript
// Generate vector embeddings for similarity matching
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: `${job.title} ${job.description} ${job.skills.join(' ')}`
});

// Store in database
await supabase.from('job_embeddings').insert({
  job_id: job.id,
  embedding: embedding.data[0].embedding,
  model: 'text-embedding-3-small'
});
```

### Scraper Configuration

#### Query Rotation System
Scrapers use rotating query sets to avoid rate limits:

```javascript
const QUERY_SETS = {
  SET_A: ['praktikum', 'werkstudent', 'absolventenprogramm'],
  SET_B: ['internship', 'graduate program', 'junior developer'],
  SET_C: ['trainee', 'entry level', 'early career']
};

// Rotate every 8 hours
const currentSet = Math.floor(Date.now() / (8 * 60 * 60 * 1000)) % 3;
```

#### Rate Limiting
- **Per-source limits**: Respect API rate limits
- **Backoff strategies**: Exponential backoff on failures
- **Concurrent requests**: Limited parallelism per scraper

### Monitoring & Reliability

#### Telemetry Collection
```javascript
const telemetry = {
  scraper_run_id: crypto.randomUUID(),
  source: 'arbeitnow',
  jobs_found: jobs.length,
  jobs_processed: processedCount,
  duration_ms: Date.now() - startTime,
  errors: errorCount
};

await supabase.from('scraper_runs').insert(telemetry);
```

#### Health Checks
- **Job source availability**: API endpoint monitoring
- **Data quality**: Validation of processed jobs
- **Performance**: Processing time per job
- **Error rates**: Failure tracking and alerting

## AI Matching Engine

### Algorithm Overview

The matching engine uses a multi-stage approach:

```
User Profile ──► Preprocessing ──► Vector Similarity ──► Reranking ──► Final Matches
      ↓               ↓                    ↓                    ↓            ↓
  Skills,         Normalization       Cosine Distance    Business Rules  Top N Results
  Experience,     Standardization     + Jaccard          + Location       with Scores
  Preferences     Tokenization        Similarity         + Experience
```

### User Profile Processing

#### Input Normalization
```typescript
interface UserProfile {
  skills: string[];
  industries: string[];
  targetCities: string[];
  careerKeywords: string;
  experienceLevel: 'entry' | 'junior' | 'mid';
  workEnvironment: 'remote' | 'hybrid' | 'onsite';
}

// Normalize and tokenize
const normalizedProfile = {
  skills: user.skills.map(s => s.toLowerCase().trim()),
  industries: user.industries.map(i => i.toLowerCase()),
  locations: user.targetCities.map(city => city.toLowerCase()),
  keywords: tokenizeKeywords(user.careerKeywords)
};
```

#### Vector Embedding Generation
```typescript
const profileText = [
  normalizedProfile.skills.join(' '),
  normalizedProfile.industries.join(' '),
  normalizedProfile.keywords,
  normalizedProfile.experienceLevel,
  normalizedProfile.workEnvironment
].join(' ');

const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: profileText,
  dimensions: 512 // Reduced for performance
});
```

### Job Matching Pipeline

#### Stage 1: Vector Similarity
```typescript
// Cosine similarity calculation
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}

// Batch similarity computation
const similarities = jobEmbeddings.map(job =>
  cosineSimilarity(userEmbedding, job.embedding)
);
```

#### Stage 2: Business Rule Filtering
```typescript
function applyBusinessRules(job: Job, user: UserProfile, similarity: number): number {
  let score = similarity;

  // Location matching (high priority)
  if (user.targetCities.some(city =>
    job.city?.toLowerCase().includes(city.toLowerCase())
  )) {
    score += 0.2;
  }

  // Experience level matching
  if (job.experience_required === user.experienceLevel) {
    score += 0.1;
  }

  // Work environment preference
  if (job.work_environment === user.workEnvironment) {
    score += 0.1;
  }

  // Skill overlap (Jaccard similarity)
  const userSkills = new Set(user.skills);
  const jobSkills = new Set(job.ai_labels);
  const intersection = new Set([...userSkills].filter(x => jobSkills.has(x)));
  const union = new Set([...userSkills, ...jobSkills]);
  const jaccardSimilarity = intersection.size / union.size;

  score += jaccardSimilarity * 0.3;

  return Math.min(score, 1.0); // Cap at 1.0
}
```

#### Stage 3: Confidence Classification
```typescript
function classifyConfidence(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.85) return 'high';
  if (score >= 0.70) return 'medium';
  return 'low';
}

function generateReasoning(job: Job, user: UserProfile, score: number): string {
  const reasons = [];

  if (score.locationMatch) reasons.push('Location match');
  if (score.skillOverlap > 0.5) reasons.push('Strong skill alignment');
  if (score.experienceMatch) reasons.push('Experience level match');

  return reasons.join(', ') || 'General career fit';
}
```

### Performance Optimizations

#### Batch Processing
```typescript
// Process users in batches to reduce database load
const BATCH_SIZE = 50;
for (let i = 0; i < users.length; i += BATCH_SIZE) {
  const batch = users.slice(i, i + BATCH_SIZE);
  await processUserBatch(batch, jobs);
}
```

#### Caching Strategy
```typescript
// Cache job embeddings for 24 hours
const jobEmbeddings = await redis.get('job_embeddings');
if (!jobEmbeddings) {
  jobEmbeddings = await loadJobEmbeddings();
  await redis.setex('job_embeddings', 86400, JSON.stringify(jobEmbeddings));
}
```

#### Index Optimization
```sql
-- Optimized for similarity queries
CREATE INDEX idx_job_embeddings_cosine ON job_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Partial indexes for active jobs only
CREATE INDEX idx_active_jobs_embedding ON jobs(id)
WHERE is_active = true;
```

### Quality Assurance

#### A/B Testing Framework
```typescript
// Test different matching algorithms
const experiments = {
  'algorithm_v1': { weight: 0.7, algorithm: cosineSimilarity },
  'algorithm_v2': { weight: 0.3, algorithm: improvedSimilarity }
};

function selectAlgorithm(userId: string): MatchingAlgorithm {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  const bucket = parseInt(hash.slice(0, 8), 16) % 100;

  let cumulativeWeight = 0;
  for (const [name, config] of Object.entries(experiments)) {
    cumulativeWeight += config.weight * 100;
    if (bucket < cumulativeWeight) {
      return config.algorithm;
    }
  }
}
```

#### Quality Metrics
- **Match acceptance rate**: Percentage of matches users engage with
- **Application conversion**: Matches that lead to applications
- **User satisfaction**: Feedback scores and retention
- **Diversity metrics**: Ensure varied job recommendations

## Component Architecture

### Frontend Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected user routes
│   ├── api/                      # API endpoints
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components
│   │   ├── button.tsx           # Button component
│   │   ├── input.tsx            # Input field
│   │   ├── card.tsx             # Card container
│   │   └── dialog.tsx           # Modal dialogs
│   ├── forms/                   # Form components
│   │   ├── signup-form.tsx      # Registration form
│   │   ├── preferences-form.tsx # User preferences
│   │   └── payment-form.tsx     # Stripe integration
│   ├── matches/                 # Job matching UI
│   │   ├── match-card.tsx       # Individual match display
│   │   ├── match-list.tsx       # Match results list
│   │   └── match-filters.tsx    # Filtering controls
│   └── sections/                # Page sections
│       ├── hero.tsx             # Landing page hero
│       ├── pricing.tsx          # Pricing display
│       └── testimonials.tsx     # Social proof
├── lib/                         # Utilities and services
│   ├── supabase-client.ts       # Database client
│   ├── stripe.ts                # Payment processing
│   ├── validation.ts            # Form validation
│   └── constants.ts             # App constants
├── hooks/                       # Custom React hooks
│   ├── use-auth.ts              # Authentication hook
│   ├── use-matches.ts           # Match data hook
│   └── use-preferences.ts       # User preferences hook
└── utils/                       # Helper functions
    ├── api-helpers.ts           # API utilities
    ├── formatters.ts            # Data formatters
    └── validators.ts            # Input validation
```

### Component Patterns

#### Server Components (Default)
```tsx
// app/dashboard/page.tsx
import { getServerSupabaseClient } from '@/lib/supabase-client';
import { MatchList } from '@/components/matches/match-list';

export default async function DashboardPage() {
  const supabase = getServerSupabaseClient();

  // Server-side data fetching
  const { data: user } = await supabase.auth.getUser();
  const { data: matches } = await supabase
    .from('job_matches')
    .select('*')
    .eq('user_id', user.user?.id)
    .limit(10);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Your Matches</h1>
      <MatchList matches={matches || []} />
    </div>
  );
}
```

#### Client Components (Interactive)
```tsx
// components/matches/match-list.tsx
'use client';

import { useState } from 'react';
import { MatchCard } from './match-card';

interface MatchListProps {
  initialMatches: JobMatch[];
}

export function MatchList({ initialMatches }: MatchListProps) {
  const [matches, setMatches] = useState(initialMatches);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.confidence_level === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['all', 'high', 'medium', 'low'].map(level => (
          <button
            key={level}
            onClick={() => setFilter(level as any)}
            className={`px-3 py-1 rounded ${
              filter === level ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {filteredMatches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
```

#### Custom Hooks
```tsx
// hooks/use-matches.ts
import { useState, useEffect } from 'react';
import { getClientSupabaseClient } from '@/lib/supabase-client';

export function useMatches(userId: string) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const supabase = getClientSupabaseClient();
        const { data, error } = await supabase
          .from('job_matches')
          .select(`
            *,
            jobs (
              title,
              company,
              location,
              job_url
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setMatches(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchMatches();
    }
  }, [userId]);

  return { matches, loading, error };
}
```

### State Management

#### Server State (React Query/TanStack Query)
```tsx
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,  // 10 minutes
    },
  },
});

// Usage in components
import { useQuery } from '@tanstack/react-query';

function useUserMatches(userId: string) {
  return useQuery({
    queryKey: ['matches', userId],
    queryFn: () => fetchUserMatches(userId),
    enabled: !!userId,
  });
}
```

#### Client State (Zustand)
```tsx
// lib/store/auth.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const supabase = getClientSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      set({ user: data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const supabase = getClientSupabaseClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
```

## Performance Considerations

### Frontend Optimization

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for unused dependencies
npx knip
```

#### Image Optimization
```tsx
// components/ui/optimized-image.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
        onLoadingComplete={() => setIsLoading(false)}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
```

#### Database Performance

#### Query Optimization
```sql
-- Optimized job matching query
EXPLAIN ANALYZE
SELECT j.*, jm.similarity_score, jm.confidence_level
FROM jobs j
JOIN job_matches jm ON j.id = jm.job_id
WHERE jm.user_id = $1
  AND j.is_active = true
  AND jm.created_at > NOW() - INTERVAL '30 days'
ORDER BY jm.similarity_score DESC
LIMIT 15;

-- Add composite index
CREATE INDEX CONCURRENTLY idx_job_matches_user_score
ON job_matches(user_id, similarity_score DESC, created_at DESC)
WHERE created_at > NOW() - INTERVAL '90 days';
```

#### Connection Pooling
```typescript
// lib/database-pool.ts (see earlier implementation)
import { DatabasePool } from './database-pool';

const pool = DatabasePool.getInstance();

// Health monitoring
setInterval(() => {
  const status = DatabasePool.getPoolStatus();
  if (!status.isHealthy) {
    console.warn('Database pool unhealthy:', status);
  }
}, 30000);
```

#### Caching Strategy
```typescript
// Redis caching for frequent queries
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedUserMatches(userId: string) {
  const cacheKey = `user_matches:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const matches = await fetchUserMatchesFromDB(userId);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(matches));

  return matches;
}
```

### API Performance

#### Response Compression
```typescript
// middleware/compression.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Enable compression for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Content-Encoding', 'gzip');
  }

  return response;
}
```

#### Rate Limiting
```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
});

export async function checkRateLimit(identifier: string) {
  const { success, reset } = await ratelimit.limit(identifier);

  if (!success) {
    throw new Error(`Rate limit exceeded. Try again in ${reset} seconds.`);
  }
}
```

### Monitoring & Observability

#### Performance Metrics
```typescript
// lib/performance-monitor.ts
export function trackApiPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) {
  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'api_performance', {
      endpoint,
      method,
      duration,
      status_code: statusCode,
    });
  }

  // Log slow requests
  if (duration > 1000) {
    console.warn(`Slow API request: ${method} ${endpoint} took ${duration}ms`);
  }
}
```

#### Error Tracking
```typescript
// lib/error-handler.ts
import * as Sentry from '@sentry/nextjs';

export function handleApiError(error: Error, context: Record<string, any>) {
  // Log to console
  console.error('API Error:', error, context);

  // Send to Sentry
  Sentry.captureException(error, {
    tags: {
      component: 'api',
      ...context,
    },
  });

  // Return standardized error response
  return {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    requestId: context.requestId,
  };
}
```

### Security Considerations

#### Input Validation
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const userSignupSchema = z.object({
  email: z.string().email().max(254),
  fullName: z.string().min(2).max(100),
  targetCities: z.array(z.string()).min(1).max(5),
  roles: z.array(z.string()).min(1).max(3),
});

export const jobMatchSchema = z.object({
  userLimit: z.number().int().min(1).max(1000),
  jobLimit: z.number().int().min(1).max(10000),
  signature: z.string().optional(),
  timestamp: z.number().optional(),
});
```

#### Authentication & Authorization
```typescript
// middleware/auth.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const isValid = await validateApiKey(token);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}
```

#### Data Sanitization
```typescript
// utils/sanitizers.ts
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurifyInstance = DOMPurify(window);

export function sanitizeHtml(html: string): string {
  return DOMPurifyInstance.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

export function sanitizeJobDescription(description: string): string {
  // Remove script tags, excessive whitespace, etc.
  return description
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

## Testing Strategy

### Test Categories

#### Unit Tests (`__tests__/unit/`)
- **Pure functions**: Utility functions, data transformations
- **Component logic**: Hooks, state management, business logic
- **API utilities**: Request/response handling, error formatting

```typescript
// __tests__/unit/matching/similarity.test.ts
import { cosineSimilarity } from '@/utils/matching/similarity';

describe('cosineSimilarity', () => {
  it('should calculate similarity correctly', () => {
    const vectorA = [1, 2, 3];
    const vectorB = [1, 2, 3];
    const result = cosineSimilarity(vectorA, vectorB);
    expect(result).toBe(1.0);
  });

  it('should handle orthogonal vectors', () => {
    const vectorA = [1, 0];
    const vectorB = [0, 1];
    const result = cosineSimilarity(vectorA, vectorB);
    expect(result).toBe(0.0);
  });
});
```

#### Integration Tests (`__tests__/api/`)
- **API endpoints**: Request/response cycles, authentication
- **Database operations**: CRUD operations, transactions
- **External services**: Mocked API calls, error handling

```typescript
// __tests__/api/match-users.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/match-users/route';
import { getDatabaseClient } from '@/utils/core/database-pool';

jest.mock('@/utils/core/database-pool');

describe('/api/match-users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 for missing authentication', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { userLimit: 100, jobLimit: 500 },
    });

    await POST(req);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should process match request with valid signature', async () => {
    // Mock database client
    const mockDbClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null }),
    };
    (getDatabaseClient as jest.Mock).mockReturnValue(mockDbClient);

    // Generate valid HMAC signature
    const timestamp = Date.now();
    const userLimit = 100;
    const jobLimit = 500;
    const signature = generateTestSignature(userLimit, jobLimit, timestamp);

    const { req } = createMocks({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { userLimit, jobLimit, signature, timestamp },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
  });
});
```

#### End-to-End Tests (`tests/e2e/`)
- **User journeys**: Signup → preferences → matches → email
- **Critical paths**: Payment flow, email delivery
- **Cross-browser**: Chrome, Firefox, Safari compatibility

```typescript
// tests/e2e/free-signup-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Free Signup Flow', () => {
  test('should complete full signup and show matches', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup');

    // Fill out form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="fullName"]', 'Test User');

    // Select preferences
    await page.click('[data-testid="city-berlin"]');
    await page.click('[data-testid="role-software-engineer"]');

    // Submit form
    await page.click('[data-testid="submit-signup"]');

    // Verify email sent
    await expect(page.locator('[data-testid="verification-sent"]'))
      .toBeVisible();

    // Simulate email verification
    const verificationLink = await getVerificationLink('test@example.com');
    await page.goto(verificationLink);

    // Check matches are displayed
    await expect(page.locator('[data-testid="match-results"]'))
      .toBeVisible();
    await expect(page.locator('[data-testid="match-card"]'))
      .toHaveCount(5);
  });
});
```

#### AI-Specific Tests (`__tests__/ai/`)
- **Matching accuracy**: Precision, recall, F1-score validation
- **Embedding quality**: Semantic similarity testing
- **Regression testing**: Compare algorithm versions

```typescript
// __tests__/ai/matching-accuracy.test.ts
describe('AI Matching Accuracy', () => {
  const testCases = [
    {
      userProfile: {
        skills: ['React', 'TypeScript', 'Node.js'],
        experience: 'junior',
        location: 'Berlin'
      },
      expectedMatches: [
        { title: 'Junior React Developer', score: 0.9 },
        { title: 'Frontend Engineer', score: 0.85 }
      ]
    }
  ];

  testCases.forEach((testCase, index) => {
    it(`should match accurately for test case ${index + 1}`, async () => {
      const matches = await generateMatches(testCase.userProfile);

      // Check top match has expected score
      expect(matches[0].similarity).toBeGreaterThan(0.8);

      // Verify relevant skills are matched
      const matchedSkills = extractSkillsFromMatches(matches);
      const commonSkills = intersection(
        testCase.userProfile.skills,
        matchedSkills
      );
      expect(commonSkills.length).toBeGreaterThan(0);
    });
  });
});
```

### Test Infrastructure

#### Test Database Setup
```typescript
// __tests__/setup/database.ts
import { createClient } from '@supabase/supabase-js';

export async function setupTestDatabase() {
  const supabase = createClient(
    process.env.SUPABASE_TEST_URL!,
    process.env.SUPABASE_TEST_KEY!
  );

  // Clean test data
  await supabase.from('job_matches').delete().neq('id', '');
  await supabase.from('users').delete().neq('id', '');

  // Insert test fixtures
  await supabase.from('users').insert(testUsers);
  await supabase.from('jobs').insert(testJobs);

  return supabase;
}
```

#### Mock Services
```typescript
// __tests__/mocks/openai.ts
export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              skills: ['React', 'TypeScript'],
              experience_level: 'junior'
            })
          }
        }]
      })
    }
  },
  embeddings: {
    create: jest.fn().mockResolvedValue({
      data: [{
        embedding: Array.from({ length: 512 }, () => Math.random())
      }]
    })
  }
};
```

#### Test Coverage
```bash
# Run tests with coverage
npm run test:coverage

# Coverage thresholds
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

### Continuous Integration

#### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Deployment & DevOps

### Vercel Configuration

#### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["fra1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    },
    "app/api/cron/**/*.ts": {
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily-scrape",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/cron/email-delivery",
      "schedule": "0 9 * * 1,3,5"
    },
    {
      "path": "/api/cron/cleanup-free-users",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/check-link-health",
      "schedule": "0 */6 * * *"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'none';"
        }
      ]
    }
  ]
}
```

### Environment Management

#### Environment Variables Strategy
```bash
# Development
cp .env.example .env.local

# Staging
cp .env.example .env.staging

# Production
# Set via Vercel dashboard or CLI
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY --sensitive
```

#### Secret Rotation
```bash
# Rotate OpenAI API key
npm run generate-secrets

# Update Vercel environment
vercel env rm OPENAI_API_KEY
vercel env add OPENAI_API_KEY

# Update Supabase secrets
npx supabase secrets set OPENAI_API_KEY=new_key
```

### Monitoring & Alerting

#### Application Performance Monitoring
```typescript
// instrumentation.ts
import { NextConfig } from 'next';

export function register() {
  // Register Sentry
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    require('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    require('./sentry.edge.config');
  }
}
```

#### Business Metrics
```typescript
// lib/business-metrics.ts
export function trackBusinessMetrics(event: string, data: Record<string, any>) {
  // PostHog
  if (typeof window !== 'undefined') {
    window.posthog.capture(event, data);
  }

  // Custom analytics
  fetch('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ event, data }),
  });
}

// Usage
trackBusinessMetrics('user_signup', {
  tier: 'free',
  source: 'organic',
  country: 'DE'
});
```

#### Infrastructure Monitoring
```bash
# Check system health
curl -f https://api.getjobping.com/health

# Monitor cron jobs
vercel logs --since 1h | grep cron

# Database performance
npx supabase db diff --schema public
```

### Backup & Recovery

#### Database Backups
```bash
# Automated Supabase backups
# (Configured in Supabase dashboard)

# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

#### Code Deployment
```bash
# Preview deployment
vercel --prod=false

# Production deployment
vercel --prod

# Rollback
vercel rollback
```

#### Incident Response
```bash
# Emergency disable
vercel env add MAINTENANCE_MODE true

# Check error rates
vercel logs --since 1h | grep ERROR | wc -l

# Scale resources (if needed)
vercel scale --min 1 --max 5
```

## Contributing

### Development Process

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-matching-algorithm
   ```

2. **Write tests first** (TDD approach)
   ```bash
   npm run test:unit -- --testPathPattern=matching
   ```

3. **Implement feature**
   ```bash
   npm run dev
   ```

4. **Run full test suite**
   ```bash
   npm run test
   npm run test:e2e
   ```

5. **Code review** and merge

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Biome formatter
- **Pre-commit hooks**: Lint and type check
- **Conventional commits**: Structured commit messages

### Documentation

- **API documentation**: Inline JSDoc comments
- **Component documentation**: Storybook (planned)
- **Architecture decisions**: ADRs in `docs/`

---

*Built with Next.js, TypeScript, and Supabase • AI-powered job matching for Europe*

## Development Setup

### Prerequisites

- **Node.js 18+** - Required for Next.js 14 and React 19
- **npm 8+** or **yarn 1.22+** - Package management
- **PostgreSQL** - Via Supabase (managed) or local instance
- **Redis** - For distributed locks and caching (optional for development)
- **Git** - Version control

### External Service Accounts

1. **Supabase** - Database and authentication
   - Create project at supabase.com
   - Enable Row Level Security
   - Set up database schema (see migrations)

2. **OpenAI** - AI job matching
   - API key with GPT-4 access
   - Monitor usage and costs

3. **Resend** - Email delivery
   - SMTP service with high deliverability
   - Domain authentication (SPF, DKIM, DMARC)

4. **Stripe** - Payment processing
   - Test mode for development
   - Webhook endpoints for subscription events

5. **Optional Services**
   - PostHog - User analytics
   - Sentry - Error monitoring
   - Redis Cloud - Distributed caching

### Local Development Setup

#### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd jobping

# Install dependencies
npm install

# Verify Node.js version
node --version  # Should be 18+
npm --version   # Should be 8+
```

#### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

**Required Environment Variables:**

```env
# ===========================================
# REQUIRED: Core Infrastructure
# ===========================================

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI API
OPENAI_API_KEY=sk-your_openai_key

# Email Service
RESEND_API_KEY=re_your_resend_key

# ===========================================
# REQUIRED: Payments (Stripe)
# ===========================================

STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ===========================================
# OPTIONAL: Analytics & Monitoring
# ===========================================

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key

# Google Analytics
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID

# Sentry Error Tracking
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id

# ===========================================
# OPTIONAL: Development & Testing
# ===========================================

# Redis (for distributed locks)
REDIS_URL=redis://localhost:6379

# Development flags
NODE_ENV=development
IS_DEBUG=true
SKIP_ADZUNA=true  # Skip slow scrapers in development

# Testing
PLAYWRIGHT_HEADLESS=true
JEST_TIMEOUT=10000
```

#### 3. Database Setup

```bash
# Install Supabase CLI (optional, for local development)
npm install -g supabase

# Initialize Supabase (if using local instance)
supabase init
supabase start

# Apply database migrations
npm run db:migrate

# Seed with test data (optional)
npm run db:seed
```

#### 4. Development Server

```bash
# Start Next.js development server
npm run dev

# Server will be available at:
# http://localhost:3000 (frontend)
# http://localhost:3000/api/health (health check)
```

#### 5. Verify Setup

```bash
# Run health check
curl http://localhost:3000/api/health

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check
```

### Development Workflow

#### Code Quality

```bash
# Format code with Biome
npm run format

# Lint and fix issues
npm run lint:biome
npm run lint:biome:fix

# Type checking
npm run type-check

# Pre-commit checks
npm run pre-push
```

#### Testing Strategy

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
npm run test:e2e:ui  # Visual testing

# AI-specific tests
npm run test:ai-comprehensive
npm run test:ai-check

# Performance tests
npm run test:performance
```

#### Database Operations

```bash
# Generate migration from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset

# Check database health
npm run check:jobs
```

#### Scraping & Automation

```bash
# Run job scrapers manually
npm run automation:embeddings

# Test email delivery
npm run test:send-emails

# Run cron jobs manually
npm run automation:start
```

### Production Deployment

#### Vercel Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and connect
   vercel login
   vercel link
   ```

2. **Environment Variables**
   - Set all production environment variables in Vercel dashboard
   - Enable production database connections
   - Configure Stripe webhooks to production URL

3. **Deploy**
   ```bash
   # Deploy to production
   vercel --prod
   ```

#### Cron Job Configuration

Vercel cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-scrape",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/cron/email-delivery",
      "schedule": "0 9 * * 1,3,5"
    },
    {
      "path": "/api/cron/cleanup-free-users",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/check-link-health",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

#### Database Migrations

```bash
# Apply migrations on production
npm run db:migrate

# Backup before major changes
# (Handled automatically by Supabase)
```

### Troubleshooting

#### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check Supabase connection
   npm run health:check

   # Verify environment variables
   node -e "console.log(process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')"
   ```

2. **Redis Connection Errors**
   ```bash
   # Check Redis connectivity
   redis-cli ping

   # Or skip Redis for development
   export REDIS_URL=""
   ```

3. **OpenAI API Errors**
   ```bash
   # Check API key
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

4. **Email Delivery Issues**
   ```bash
   # Test Resend API
   curl -X POST https://api.resend.com/emails \
        -H "Authorization: Bearer $RESEND_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"from":"test@yourdomain.com","to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
   ```

#### Performance Monitoring

```bash
# Check performance metrics
npm run check:performance

# Monitor AI production
npm run monitor:ai-production

# View logs
vercel logs
```

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── api/               # API endpoints
│   ├── dashboard/         # User dashboard
│   └── signup/            # Registration flow
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── matches/          # Job matching components
├── lib/                  # Utility libraries
├── scrapers/            # Job scraping scripts
├── automation/          # Cron job scripts
├── supabase/            # Database migrations and config
└── utils/               # Helper functions
```

## Development

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests
npm run test
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Database Operations
```bash
# Create migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Reset database
npm run db:reset
```

## Deployment

The application is configured for Vercel deployment with automated CI/CD.

### Cron Jobs
- Daily job scraping at 2 AM CET
- Email delivery at 9 AM CET (Mon/Wed/Fri)
- User cleanup at 3 AM CET
- Health checks every 6 hours

### Monitoring
- Sentry for error tracking
- Vercel Analytics for performance
- PostHog for user behavior
- Supabase monitoring for database health