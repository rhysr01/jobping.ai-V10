-- Enhanced Language Extraction Migration
-- Populates language_requirements for remaining 18,483 jobs (65%)
-- Uses enhanced patterns, city context, and company hints
-- Target: 70%+ explicit language data

-- Step 1: Extract explicit language mentions from descriptions and titles
-- Enhanced patterns for less common languages
UPDATE jobs
SET language_requirements = ARRAY['Portuguese']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(portuguese|português|portugues|fluent.*portuguese|native.*portuguese|portuguese.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Swedish']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(swedish|svenska|fluent.*swedish|native.*swedish|swedish.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Danish']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(danish|dansk|fluent.*danish|native.*danish|danish.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Finnish']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(finnish|suomi|fluent.*finnish|native.*finnish|finnish.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Romanian']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(romanian|română|romana|fluent.*romanian|native.*romanian|romanian.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Hungarian']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(hungarian|magyar|fluent.*hungarian|native.*hungarian|hungarian.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Greek']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(greek|ελληνικά|fluent.*greek|native.*greek|greek.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Bulgarian']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(bulgarian|български|fluent.*bulgarian|native.*bulgarian|bulgarian.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Croatian']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(croatian|hrvatski|fluent.*croatian|native.*croatian|croatian.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Serbian']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(serbian|српски|fluent.*serbian|native.*serbian|serbian.*speaker)\b'
  );

UPDATE jobs
SET language_requirements = ARRAY['Ukrainian']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(description || ' ' || COALESCE(title, '')) ~* '\b(ukrainian|українська|fluent.*ukrainian|native.*ukrainian|ukrainian.*speaker)\b'
  );

-- Step 2: City-based language inference
-- Infer languages from city context (only if no language data exists)
UPDATE jobs
SET language_requirements = ARRAY['French']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) = 'paris';

UPDATE jobs
SET language_requirements = ARRAY['German']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) IN ('berlin', 'munich', 'hamburg', 'vienna', 'zurich');

UPDATE jobs
SET language_requirements = ARRAY['Dutch']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) = 'amsterdam';

UPDATE jobs
SET language_requirements = ARRAY['Spanish']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) IN ('madrid', 'barcelona');

UPDATE jobs
SET language_requirements = ARRAY['Italian']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) IN ('milan', 'rome');

UPDATE jobs
SET language_requirements = ARRAY['French']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) = 'brussels';

UPDATE jobs
SET language_requirements = ARRAY['Swedish']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) = 'stockholm';

UPDATE jobs
SET language_requirements = ARRAY['Danish']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) = 'copenhagen';

UPDATE jobs
SET language_requirements = ARRAY['Czech']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) = 'prague';

UPDATE jobs
SET language_requirements = ARRAY['Polish']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) = 'warsaw';

UPDATE jobs
SET language_requirements = ARRAY['English']
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND LOWER(city) IN ('dublin', 'london', 'manchester', 'birmingham');

-- Step 3: Company name pattern inference
-- German companies
UPDATE jobs
SET language_requirements = CASE 
  WHEN language_requirements IS NULL OR array_length(language_requirements, 1) = 0
  THEN ARRAY['German']
  ELSE language_requirements || ARRAY['German']
END
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) = 0)
  AND (
    LOWER(company) ~* '\b(deutsche|gmbh|ag\s|aktien|bank.*deutsch)\b'
  );

-- Step 4: Default to English for all remaining jobs
UPDATE jobs
SET language_requirements = ARRAY['English']
WHERE language_requirements IS NULL OR array_length(language_requirements, 1) = 0;

-- Verify coverage
-- Expected: 70%+ of jobs should have explicit language data (not just English fallback)
-- This query shows jobs with non-English languages or multiple languages
SELECT 
  COUNT(*) as total_jobs,
  SUM(CASE WHEN language_requirements IS NOT NULL AND array_length(language_requirements, 1) > 0 THEN 1 ELSE 0 END) as jobs_with_languages,
  SUM(CASE WHEN language_requirements @> ARRAY['English'] AND array_length(language_requirements, 1) = 1 THEN 1 ELSE 0 END) as english_only,
  SUM(CASE WHEN language_requirements @> ARRAY['English'] = false OR array_length(language_requirements, 1) > 1 THEN 1 ELSE 0 END) as explicit_language_data,
  ROUND(100.0 * SUM(CASE WHEN language_requirements @> ARRAY['English'] = false OR array_length(language_requirements, 1) > 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as explicit_coverage_percent
FROM jobs;

