-- ============================================================================
-- REMOVE ENTRY-LEVEL TYPE CATEGORIES FROM JOBS TABLE
-- Date: January 29, 2026
-- Purpose: Remove early-career, internship, graduate, general from categories
--          These are now separate boolean flags (is_early_career, is_internship, is_graduate)
--          Process in batches of 5000 to avoid timeout
-- ============================================================================

BEGIN;

-- Batch 1: Remove 'early-career' from categories (16 jobs)
UPDATE jobs
SET categories = array_remove(categories, 'early-career')
WHERE 'early-career' = ANY(categories)
  AND id IN (
    SELECT id FROM jobs 
    WHERE 'early-career' = ANY(categories)
    ORDER BY id
    LIMIT 5000
  );

-- Batch 2: Remove 'internship' from categories (16 jobs)
UPDATE jobs
SET categories = array_remove(categories, 'internship')
WHERE 'internship' = ANY(categories)
  AND id IN (
    SELECT id FROM jobs 
    WHERE 'internship' = ANY(categories)
    ORDER BY id
    LIMIT 5000
  );

-- Batch 3: Remove 'graduate' from categories (15 jobs)
UPDATE jobs
SET categories = array_remove(categories, 'graduate')
WHERE 'graduate' = ANY(categories)
  AND id IN (
    SELECT id FROM jobs 
    WHERE 'graduate' = ANY(categories)
    ORDER BY id
    LIMIT 5000
  );

-- Batch 4: Remove 'general' from categories (5 jobs, not a valid path)
UPDATE jobs
SET categories = array_remove(categories, 'general')
WHERE 'general' = ANY(categories)
  AND id IN (
    SELECT id FROM jobs 
    WHERE 'general' = ANY(categories)
    ORDER BY id
    LIMIT 5000
  );

-- Batch 5: Set empty/null categories to ['unsure'] (fallback)
UPDATE jobs
SET categories = ARRAY['unsure']::text[]
WHERE (categories IS NULL 
   OR array_length(categories, 1) IS NULL 
   OR array_length(categories, 1) = 0)
  AND id IN (
    SELECT id FROM jobs 
    WHERE (categories IS NULL 
       OR array_length(categories, 1) IS NULL 
       OR array_length(categories, 1) = 0)
    ORDER BY id
    LIMIT 5000
  );

COMMIT;

