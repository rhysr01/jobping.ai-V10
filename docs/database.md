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

