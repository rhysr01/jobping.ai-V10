-- ============================================================================
-- REMOVE US JOBS (Non-European Locations)
-- Date: January 29, 2026
-- Purpose: Mark US jobs as inactive (keep for audit, don't delete)
-- ============================================================================

BEGIN;

-- Mark US jobs as inactive
-- Keep them in database for audit purposes but exclude from active matching
UPDATE jobs
SET 
    is_active = false,
    status = 'inactive',
    filtered_reason = 'Non-European location'
WHERE (
    country IN ('United States', 'US', 'USA', 'Ca', 'Mt', 'Washington Dc')
    OR city IN ('Washington Dc', 'Pleasanton', 'Oakland', 'Bozeman')
    OR LOWER(country) LIKE '%united states%'
    OR LOWER(country) LIKE '%usa%'
)
AND is_active = true
AND status = 'active';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================
-- SELECT COUNT(*) as us_jobs_inactive FROM jobs WHERE is_active = false AND filtered_reason = 'Non-European location';
-- SELECT city, country, COUNT(*) FROM jobs WHERE is_active = false AND filtered_reason = 'Non-European location' GROUP BY city, country;

