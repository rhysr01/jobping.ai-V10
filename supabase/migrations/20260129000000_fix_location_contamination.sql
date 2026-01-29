-- ============================================================================
-- FIX LOCATION CONTAMINATION AND MISSING CITIES
-- Date: January 29, 2026
-- Purpose: Fix wrong country/city pairs and fill missing cities
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FIX COUNTRY/CITY MISMATCHES (Batch Update)
-- ============================================================================

-- Fix Berlin, United Kingdom → Berlin, Germany
UPDATE jobs
SET country = 'Germany'
WHERE city = 'Berlin' AND country = 'United Kingdom';

-- Fix Paris, United Kingdom → Paris, France
UPDATE jobs
SET country = 'France'
WHERE city = 'Paris' AND country = 'United Kingdom';

-- Fix Belfast, Ireland → Belfast, United Kingdom (Belfast is in Northern Ireland, part of UK)
UPDATE jobs
SET country = 'United Kingdom'
WHERE city = 'Belfast' AND country = 'Ireland';

-- ============================================================================
-- 2. FILL MISSING CITIES FROM LOCATION FIELD
-- ============================================================================

-- Extract city from location if city is NULL
UPDATE jobs
SET city = TRIM(SPLIT_PART(location, ',', 1))
WHERE (city IS NULL OR city = '')
  AND location IS NOT NULL
  AND location != ''
  AND SPLIT_PART(location, ',', 1) != '';

-- ============================================================================
-- 3. MARK REMAINING NULL CITY JOBS AS REMOTE
-- ============================================================================

-- For jobs with no city and no location, mark as remote_possible
-- These are likely remote jobs that don't specify a location
UPDATE jobs
SET remote_possible = true
WHERE (city IS NULL OR city = '')
  AND (location IS NULL OR location = '')
  AND remote_possible = false;

-- Note: Trigger function will be updated in next migration (20260129000001_extract_job_metadata.sql)
-- This migration only handles batch fixes for existing data

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================
-- SELECT COUNT(*) as berlin_uk_fixed FROM jobs WHERE city = 'Berlin' AND country = 'United Kingdom';
-- SELECT COUNT(*) as paris_uk_fixed FROM jobs WHERE city = 'Paris' AND country = 'United Kingdom';
-- SELECT COUNT(*) as missing_cities FROM jobs WHERE (city IS NULL OR city = '') AND is_active = true;
-- SELECT COUNT(*) as remote_marked FROM jobs WHERE remote_possible = true;

