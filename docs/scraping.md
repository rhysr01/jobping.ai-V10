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

## Data Quality Enforcement

### Work-Type Categories Validation

JobPing implements a 4-layer enforcement system to ensure all jobs have proper work-type categories for accurate matching.

#### Key Components
- **Processor**: `scrapers/shared/processor.cjs` - Auto-infers work-type categories
- **Validator**: `scrapers/shared/jobValidator.cjs` - Enforces standards
- **Inference Module**: `scrapers/shared/workTypeInference.cjs` - Category inference logic
- **Database Trigger**: Prevents jobs without categories from being saved

#### Inference Logic
The system automatically infers work-type categories from job descriptions:

```javascript
// Strong positive signals
if (description.match(/(remote|work from home|flexible location)/i)) {
  categories.push('remote');
}

if (description.match(/(full.?time|permanent|full time)/i)) {
  categories.push('full-time');
}

// Company size inference
if (company.match(/(google|microsoft|meta|amazon)/i)) {
  categories.push('large-enterprise');
}
```

#### Validation Rules
- **Required**: At least one work-type category per job
- **Standards**: Categories must match predefined taxonomy
- **Fallback**: Unknown categories are rejected, not saved
- **Audit**: All category assignments are logged

#### Verification Queries
```sql
-- Check jobs with missing categories
SELECT COUNT(*) as jobs_without_categories
FROM jobs
WHERE categories IS NULL OR array_length(categories, 1) = 0;

-- Verify category distribution
SELECT unnest(categories) as category, COUNT(*) as count
FROM jobs
WHERE categories IS NOT NULL
GROUP BY unnest(categories)
ORDER BY count DESC;

-- Recent category assignments
SELECT title, company, categories, created_at
FROM jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
```

#### Quality Metrics
- **Coverage Rate**: >99.5% of jobs have work-type categories
- **Accuracy Rate**: >95% of inferred categories are correct
- **Rejection Rate**: <0.1% of jobs rejected due to category issues

This enforcement ensures consistent, high-quality job data for reliable matching across all user preferences.
