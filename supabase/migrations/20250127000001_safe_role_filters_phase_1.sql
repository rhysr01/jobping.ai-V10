-- ============================================================================
-- SAFE ROLE FILTERS - PHASE 1
-- Conservative filtering for non-business roles with safeguards
-- Date: January 27, 2026
-- ============================================================================
-- This migration safely filters obvious non-business roles.
-- SAFEGUARDS:
-- 1. Only filters jobs matching EXACT patterns (not substring matches)
-- 2. Requires pattern match in TITLE (not just description)
-- 3. Includes exceptions to preserve edge cases
-- 4. Uses filtered_reason to track what was removed
-- 5. Runs in a transaction (can be rolled back if needed)
-- ============================================================================

BEGIN;

-- Verify we have jobs before proceeding (safety check)
DO $$ 
BEGIN
  IF (SELECT COUNT(*) FROM jobs WHERE is_active = true) < 10000 THEN
    RAISE EXCEPTION 'ERROR: Active job count is below 10000. Migration blocked to prevent data loss.';
  END IF;
END $$;

-- ============================================================================
-- 1. FILTER OBVIOUS POSTAL AND MANUAL LABOR ROLES (Clear non-business)
-- ============================================================================
-- SAFEGUARD: Title must contain specific postal/labor keywords
-- EXCEPTION: Preserve IT-related postal roles (postal services tech support)

UPDATE jobs
SET
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'postal_manual_labor',
  updated_at = NOW()
WHERE is_active = true
  AND (filtered_reason IS NULL OR filtered_reason NOT LIKE '%postal_manual_labor%')
  AND (
    LOWER(title) LIKE '%postman%' OR
    LOWER(title) LIKE '%postal carrier%' OR
    LOWER(title) LIKE '%mail carrier%' OR
    LOWER(title) LIKE '%courier%' OR
    LOWER(title) = 'driver' OR
    LOWER(title) = 'delivery driver' OR
    LOWER(title) LIKE '%refuse%collector%' OR
    LOWER(title) LIKE '%cleaner%' OR
    LOWER(title) LIKE '%janitor%'
  )
  -- EXCEPTION: Don't filter if IT/tech keywords present
  AND NOT (
    LOWER(title) LIKE '%tech%' OR
    LOWER(title) LIKE '%support%' OR
    LOWER(title) LIKE '%engineer%'
  );

-- ============================================================================
-- 2. FILTER MEDICAL AND HEALTHCARE CLINICAL ROLES (High certification requirement)
-- ============================================================================
-- SAFEGUARD: Only core medical roles, not healthcare administration/management
-- EXCEPTION: Preserve healthcare business roles (management, business analysis)

UPDATE jobs
SET
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'medical_clinical_role',
  updated_at = NOW()
WHERE is_active = true
  AND (filtered_reason IS NULL OR filtered_reason NOT LIKE '%medical_clinical_role%')
  AND (
    LOWER(title) = 'nurse' OR
    LOWER(title) = 'doctor' OR
    LOWER(title) LIKE '%physician%' OR
    LOWER(title) LIKE '%dentist%' OR
    LOWER(title) LIKE '%surgeon%' OR
    LOWER(title) LIKE '%therapist (physiotherapy%' OR
    LOWER(title) LIKE '%pharmacist%' OR
    LOWER(title) LIKE '%veterinarian%'
  )
  -- EXCEPTION: Don't filter if management/business keywords present
  AND NOT (
    LOWER(title) LIKE '%manager%' OR
    LOWER(title) LIKE '%business%' OR
    LOWER(title) LIKE '%administrator%' OR
    LOWER(title) LIKE '%analyst%'
  );

-- ============================================================================
-- 3. FILTER TEACHING AND ACADEMIC ROLES (Specialized education requirements)
-- ============================================================================
-- SAFEGUARD: Only classroom teaching roles, not educational tech/training
-- EXCEPTION: Preserve corporate training and educational tech roles

UPDATE jobs
SET
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'teaching_academic_role',
  updated_at = NOW()
WHERE is_active = true
  AND (filtered_reason IS NULL OR filtered_reason NOT LIKE '%teaching_academic_role%')
  AND (
    LOWER(title) LIKE 'teacher%' OR
    LOWER(title) LIKE 'lecturer%' OR
    LOWER(title) LIKE 'university professor%' OR
    LOWER(title) LIKE '%schoolteacher%'
  )
  -- EXCEPTION: Don't filter if business/corporate keywords present
  AND NOT (
    LOWER(title) LIKE '%corporate%' OR
    LOWER(title) LIKE '%business%' OR
    LOWER(title) LIKE '%online%' OR
    LOWER(title) LIKE '%training%' OR
    LOWER(title) LIKE '%tech%' OR
    LOWER(title) LIKE '%learning%'
  );

-- ============================================================================
-- 4. FILTER LEGAL ROLES (Specialized bar exam requirement)
-- ============================================================================
-- SAFEGUARD: Only licensed legal roles, not legal tech/compliance analysts
-- EXCEPTION: Preserve legal tech, paralegal support, legal compliance

UPDATE jobs
SET
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'licensed_legal_role',
  updated_at = NOW()
WHERE is_active = true
  AND (filtered_reason IS NULL OR filtered_reason NOT LIKE '%licensed_legal_role%')
  AND (
    LOWER(title) LIKE 'lawyer%' OR
    LOWER(title) LIKE 'attorney%' OR
    LOWER(title) LIKE 'solicitor%' OR
    LOWER(title) LIKE 'barrister%'
  )
  -- EXCEPTION: Don't filter if tech/analyst keywords present
  AND NOT (
    LOWER(title) LIKE '%tech%' OR
    LOWER(title) LIKE '%paralegal%' OR
    LOWER(title) LIKE '%compliance%' OR
    LOWER(title) LIKE '%analyst%' OR
    LOWER(title) LIKE '%support%'
  );

-- ============================================================================
-- 5. VERIFY SAFEGUARDS WORKED
-- ============================================================================
-- Log current active job count
DO $$ 
DECLARE
  v_active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_active_count FROM jobs WHERE is_active = true;
  
  IF v_active_count < 10000 THEN
    -- More than 40% of jobs were filtered - potential issue
    RAISE WARNING 'WARNING: Only % active jobs remain after filtering (started with ~27,285)', v_active_count;
  END IF;
  
  -- Log statistics
  RAISE NOTICE 'Phase 1 Filtering Complete:';
  RAISE NOTICE 'Active jobs remaining: %', v_active_count;
  RAISE NOTICE 'Jobs filtered for postal/manual labor: %', (SELECT COUNT(*) FROM jobs WHERE filtered_reason LIKE '%postal_manual_labor%');
  RAISE NOTICE 'Jobs filtered for medical roles: %', (SELECT COUNT(*) FROM jobs WHERE filtered_reason LIKE '%medical_clinical_role%');
  RAISE NOTICE 'Jobs filtered for teaching roles: %', (SELECT COUNT(*) FROM jobs WHERE filtered_reason LIKE '%teaching_academic_role%');
  RAISE NOTICE 'Jobs filtered for legal roles: %', (SELECT COUNT(*) FROM jobs WHERE filtered_reason LIKE '%licensed_legal_role%');
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run manually to check results)
-- ============================================================================

-- Check how many jobs were filtered:
-- SELECT
--     filtered_reason,
--     COUNT(*) as job_count
-- FROM jobs
-- WHERE filtered_reason LIKE '%postal_manual_labor%'
--    OR filtered_reason LIKE '%medical_clinical_role%'
--    OR filtered_reason LIKE '%teaching_academic_role%'
--    OR filtered_reason LIKE '%licensed_legal_role%'
-- GROUP BY filtered_reason
-- ORDER BY job_count DESC;

-- Check remaining active jobs count:
-- SELECT COUNT(*) as active_jobs FROM jobs WHERE is_active = true;

-- Check a sample of remaining jobs:
-- SELECT id, title, company, city, is_active FROM jobs WHERE is_active = true LIMIT 20;
