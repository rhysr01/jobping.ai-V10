## AI Matching Engine

### Algorithm Overview

The matching engine uses a multi-stage approach:

```
User Profile ──► Preprocessing ──► AI Matching ──► Business Logic ──► Final Matches
      ↓               ↓                    ↓                    ↓            ↓
  Skills,         Normalization       GPT-4 Scoring    UserChoiceRespect  Top N Results
  Experience,     Standardization     + Embeddings     + City Balance     with Scores
  Preferences     Tokenization        + Similarity     + Source Diversity
```

### UserChoiceRespector - Business Logic Layer

Applied after AI matching to honor user preferences and demonstrate platform value:

#### City Balance (1-3 cities)
```typescript
// Distributes matches evenly across selected cities
UserChoiceRespector.distributeBySelectedCities(matches, userCities);
// Result: If user selects London + Berlin, gets ~50% London, ~50% Berlin
```

#### Source Diversity (Platform Value)
```typescript
// Ensures at least 2 job sources in matches
UserChoiceRespector.ensureSourceDiversity(matches);
// Result: Shows jobs from Reed + Indeed + Adzuna (demonstrates 8-scraper breadth)
```

#### Career Path Balance (Premium Feature)
```typescript
// Premium users with 2 paths get balanced distribution
if (isPremium && careerPaths.length === 2) {
  UserChoiceRespector.distributeByCareerPaths(matches, careerPaths);
}
// Result: ~50% tech jobs, ~50% consulting jobs
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

