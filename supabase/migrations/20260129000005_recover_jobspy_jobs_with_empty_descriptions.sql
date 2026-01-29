-- ============================================================================
-- RECOVER JOBSPY JOBS WITH EMPTY DESCRIPTIONS
-- Date: January 29, 2026
-- Purpose: Generate basic descriptions from title + company for JobSpy jobs
--          that have empty descriptions but valid metadata
-- ============================================================================

BEGIN;

-- Generate basic descriptions from title + company for jobs with empty descriptions
-- This matches the processor fallback logic: "Job opportunity. {title} at {company}."
UPDATE jobs
SET 
    description = CASE
        WHEN title IS NOT NULL AND title != '' AND company IS NOT NULL AND company != '' THEN
            'Job opportunity. ' || title || ' at ' || company || '.'
        WHEN title IS NOT NULL AND title != '' THEN
            'Job opportunity. ' || title || '.'
        WHEN company IS NOT NULL AND company != '' THEN
            'Job opportunity at ' || company || '.'
        ELSE
            'Job opportunity.'
    END,
    is_active = true,
    status = 'active',
    filtered_reason = NULL,
    updated_at = NOW()
WHERE is_active = false
  AND filtered_reason = 'Missing or insufficient description (minimum 50 characters required)'
  AND (description IS NULL OR description = '')
  AND title IS NOT NULL
  AND title != ''
  AND company IS NOT NULL
  AND company != ''
  AND job_url IS NOT NULL
  AND job_url != ''
  AND job_url != '#';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================
-- SELECT COUNT(*) as recovered_jobs FROM jobs WHERE is_active = true AND description LIKE 'Job opportunity.%';
-- SELECT source, COUNT(*) FROM jobs WHERE is_active = true AND description LIKE 'Job opportunity.%' GROUP BY source;

