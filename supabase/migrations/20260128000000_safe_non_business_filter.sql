-- ============================================================================
-- SAFE NON-BUSINESS JOB FILTER
-- Version 2: Conservative, AI-engine friendly filtering
-- Purpose: Remove truly non-business jobs (teaching, medical, etc.)
-- Date: January 28, 2026
-- ============================================================================
-- KEY CHANGES FROM AGGRESSIVE VERSION:
-- ❌ REMOVED: Seniority filtering (Senior, Manager, Director)
--    Reason: Matching engine is AI-powered, scores relevance
--    Problem: "Senior Data Analyst" might be grad-friendly, let AI score it
-- ✅ KEPT: Only truly non-business roles (doctors, nurses, teachers, lawyers)
-- ✅ CONSERVATIVE: Title-based detection only for clear cases
-- ✅ SAFEGUARD: Prevents over-filtering with multiple exclusions
-- ✅ LOGGED: All filtering tracked in filtered_reason field
-- ============================================================================

BEGIN;

-- ============================================================================
-- SAFETY THRESHOLD: Prevent catastrophic filtering
-- ============================================================================
DO $$ 
BEGIN
  IF (SELECT COUNT(*) FROM jobs WHERE is_active = true) < 25000 THEN
    RAISE EXCEPTION 'ERROR: Active job count is below 25000. Migration blocked to prevent data loss.';
  END IF;
END $$;

-- ============================================================================
-- 1. FILTER TEACHING/EDUCATION ROLES ONLY
-- ============================================================================
-- Remove: Teacher, Professor, Lecturer, Educator (not business trainers)
-- Keep: Corporate Trainer, Business Education, Training Consultant
-- Estimated: ~20 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'teaching_education_role',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) = 'teacher' OR
    LOWER(title) = 'professor' OR
    LOWER(title) = 'lecturer' OR
    LOWER(title) = 'educator' OR
    LOWER(title) LIKE '%primary school teacher%' OR
    LOWER(title) LIKE '%secondary school teacher%' OR
    LOWER(title) LIKE '%high school teacher%' OR
    LOWER(title) LIKE '%university professor%' OR
    LOWER(title) LIKE '%academic professor%' OR
    LOWER(title) LIKE '%research professor%' OR
    LOWER(title) LIKE '%school lecturer%' OR
    LOWER(title) LIKE '%university lecturer%'
  )
  -- Keep business-related roles
  AND NOT (
    LOWER(title) LIKE '%corporate trainer%' OR
    LOWER(title) LIKE '%training consultant%' OR
    LOWER(title) LIKE '%business education%' OR
    LOWER(description) LIKE '%corporate training%' OR
    LOWER(description) LIKE '%business education%'
  );

-- ============================================================================
-- 2. FILTER MEDICAL/HEALTHCARE DIRECT CARE ROLES ONLY
-- ============================================================================
-- Remove: Doctor, Nurse, Surgeon, Dentist, etc. (direct patient care)
-- Keep: Healthcare Manager, Healthcare Analyst, Healthcare Business (business roles)
-- Estimated: ~15 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'medical_direct_care_role',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) = 'nurse' OR
    LOWER(title) = 'doctor' OR
    LOWER(title) = 'physician' OR
    LOWER(title) = 'dentist' OR
    LOWER(title) = 'surgeon' OR
    LOWER(title) = 'therapist' OR
    LOWER(title) = 'psychologist' OR
    LOWER(title) = 'pharmacist' OR
    LOWER(title) = 'veterinarian' OR
    LOWER(title) LIKE '%registered nurse%' OR
    LOWER(title) LIKE '%rn %' OR
    LOWER(title) LIKE '%general practitioner%' OR
    LOWER(title) LIKE '%gp %' OR
    LOWER(title) LIKE '%dental surgeon%' OR
    LOWER(title) LIKE '%cardiac surgeon%' OR
    LOWER(title) LIKE '%therapist%' OR
    LOWER(title) LIKE '%counselor%'
  )
  -- Keep business/management healthcare roles
  AND NOT (
    LOWER(title) LIKE '%healthcare manager%' OR
    LOWER(title) LIKE '%healthcare analyst%' OR
    LOWER(title) LIKE '%healthcare consultant%' OR
    LOWER(title) LIKE '%hospital administrator%' OR
    LOWER(title) LIKE '%healthcare business%' OR
    LOWER(title) LIKE '%medical sales%' OR
    LOWER(title) LIKE '%pharmaceutical sales%' OR
    LOWER(description) LIKE '%healthcare management%' OR
    LOWER(description) LIKE '%healthcare administration%'
  );

-- ============================================================================
-- 3. FILTER TRADITIONAL LEGAL ROLES ONLY
-- ============================================================================
-- Remove: Lawyer, Attorney, Solicitor, Barrister (practicing law)
-- Keep: Compliance, Regulatory, Legal Analyst, Business Legal (business-adjacent)
-- Estimated: ~5 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'practicing_legal_role',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) = 'lawyer' OR
    LOWER(title) = 'attorney' OR
    LOWER(title) = 'solicitor' OR
    LOWER(title) = 'barrister' OR
    LOWER(title) LIKE '%practicing lawyer%' OR
    LOWER(title) LIKE '%law firm%' OR
    LOWER(title) LIKE '%legal counsel%' OR
    LOWER(title) LIKE '%in-house counsel%' OR
    LOWER(title) LIKE '%general counsel%'
  )
  -- Keep business-adjacent legal roles
  AND NOT (
    LOWER(title) LIKE '%compliance%' OR
    LOWER(title) LIKE '%regulatory%' OR
    LOWER(title) LIKE '%legal analyst%' OR
    LOWER(title) LIKE '%junior legal%' OR
    LOWER(title) LIKE '%legal assistant%' OR
    LOWER(title) LIKE '%legal intern%' OR
    LOWER(description) LIKE '%compliance%' OR
    LOWER(description) LIKE '%regulatory%'
  );

-- ============================================================================
-- 4. FILTER CONSTRUCTION/MANUAL LABOR ROLES
-- ============================================================================
-- Remove: Construction Worker, Electrician, Plumber, Builder, etc.
-- Estimated: ~30 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'construction_manual_labor',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) LIKE '%construction worker%' OR
    LOWER(title) LIKE '%electrician%' OR
    LOWER(title) LIKE '%plumber%' OR
    LOWER(title) LIKE '%builder%' OR
    LOWER(title) LIKE '%carpenter%' OR
    LOWER(title) LIKE '%welder%' OR
    LOWER(title) LIKE '%bricklayer%' OR
    LOWER(title) LIKE '%site supervisor%' OR
    LOWER(title) LIKE '%forklift operator%' OR
    LOWER(title) LIKE '%warehouse operative%' OR
    LOWER(title) LIKE '%factory worker%'
  )
  -- Keep management/business roles in these fields
  AND NOT (
    LOWER(title) LIKE '%construction manager%' OR
    LOWER(title) LIKE '%site manager%' OR
    LOWER(title) LIKE '%project manager%' OR
    LOWER(title) LIKE '%construction consultant%'
  );

-- ============================================================================
-- 5. FILTER POSTAL/RETAIL DELIVERY ROLES
-- ============================================================================
-- Remove: Postal Worker, Delivery Driver (operational, not business)
-- Keep: Delivery Manager, Logistics Coordinator, Supply Chain (business roles)
-- Estimated: ~50 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'postal_delivery_operational',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) = 'postal worker' OR
    LOWER(title) = 'postman' OR
    LOWER(title) = 'postwoman' OR
    LOWER(title) LIKE '%delivery driver%' OR
    LOWER(title) LIKE '%courier%' OR
    LOWER(title) LIKE '%mail carrier%' OR
    LOWER(title) LIKE '%sorting office worker%'
  )
  -- Keep supply chain/logistics business roles
  AND NOT (
    LOWER(title) LIKE '%delivery manager%' OR
    LOWER(title) LIKE '%logistics%' OR
    LOWER(title) LIKE '%supply chain%' OR
    LOWER(title) LIKE '%warehouse manager%' OR
    LOWER(title) LIKE '%operations manager%' OR
    LOWER(description) LIKE '%logistics%' OR
    LOWER(description) LIKE '%supply chain%'
  );

-- ============================================================================
-- 6. FILTER ENTERTAINMENT/ARTISTIC ROLES
-- ============================================================================
-- Remove: Actor, Musician, Artist, Director (artistic, not business school)
-- Keep: Marketing/Creative roles in media (these are business paths)
-- Estimated: ~40 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'entertainment_artistic_role',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) = 'actor' OR
    LOWER(title) = 'actress' OR
    LOWER(title) LIKE '%musician%' OR
    LOWER(title) LIKE '%dancer%' OR
    LOWER(title) LIKE '%performer%' OR
    LOWER(title) = 'artist' OR
    LOWER(title) LIKE '%sculptor%' OR
    LOWER(title) LIKE '%painter%' OR
    LOWER(title) LIKE '%film director%' OR
    LOWER(title) LIKE '%film producer%' OR
    LOWER(title) LIKE '%screenwriter%' OR
    LOWER(title) LIKE '%playwright%' OR
    LOWER(title) LIKE '%dj%' OR
    LOWER(title) LIKE '%comedian%'
  )
  -- Keep marketing/creative business roles
  AND NOT (
    LOWER(title) LIKE '%marketing%' OR
    LOWER(title) LIKE '%creative director%' OR
    LOWER(title) LIKE '%brand%' OR
    LOWER(title) LIKE '%content%' OR
    LOWER(title) LIKE '%media manager%' OR
    LOWER(description) LIKE '%marketing%' OR
    LOWER(description) LIKE '%creative strategy%'
  );

-- ============================================================================
-- 7. FILTER HOSPITALITY/FOOD SERVICE ROLES
-- ============================================================================
-- Remove: Chef, Cook, Bartender, Server (operational hospitality, not business)
-- Keep: Hotel Manager, Restaurant Manager (management roles are business)
-- Estimated: ~50 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'hospitality_food_service',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) = 'chef' OR
    LOWER(title) = 'cook' OR
    LOWER(title) = 'pastry chef' OR
    LOWER(title) LIKE '%bartender%' OR
    LOWER(title) LIKE '%sommelier%' OR
    LOWER(title) = 'waiter' OR
    LOWER(title) = 'waitress' OR
    LOWER(title) LIKE '%server%' OR
    LOWER(title) LIKE '%tour guide%'
  )
  -- Keep management/business roles in hospitality
  AND NOT (
    LOWER(title) LIKE '%hotel manager%' OR
    LOWER(title) LIKE '%restaurant manager%' OR
    LOWER(title) LIKE '%food manager%' OR
    LOWER(title) LIKE '%operations manager%' OR
    LOWER(description) LIKE '%management%' OR
    LOWER(description) LIKE '%hospitality management%'
  );

-- ============================================================================
-- 8. FILTER SPORTS & FITNESS ROLES
-- ============================================================================
-- Remove: Athlete, Coach, Trainer (physical skills, not business analysis)
-- Keep: Sports Manager, Sports Analyst (business-adjacent)
-- Estimated: ~20 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'sports_fitness_role',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) = 'athlete' OR
    LOWER(title) LIKE '%coach%' OR
    LOWER(title) LIKE '%trainer%' OR
    LOWER(title) LIKE '%fitness instructor%' OR
    LOWER(title) LIKE '%personal trainer%'
  )
  -- Keep business-adjacent roles
  AND NOT (
    LOWER(title) LIKE '%sports manager%' OR
    LOWER(title) LIKE '%sports analyst%' OR
    LOWER(title) LIKE '%coaching director%' OR
    LOWER(description) LIKE '%management%' OR
    LOWER(description) LIKE '%analytics%'
  );

-- ============================================================================
-- 9. FILTER SKILLED MECHANICAL TRADES
-- ============================================================================
-- Remove: Mechanic, HVAC, Technician (trade skills, not business)
-- Keep: Facilities Manager, Technical Project Manager (business roles)
-- Estimated: ~25 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'skilled_mechanical_trade',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) LIKE '%mechanic%' OR
    LOWER(title) LIKE '%hvac%' OR
    LOWER(title) LIKE '%automotive technician%' OR
    LOWER(title) LIKE '%technician%' AND (
      LOWER(title) LIKE '%field%' OR
      LOWER(title) LIKE '%service%' OR
      LOWER(title) LIKE '%maintenance%'
    )
  )
  -- Keep management/project management roles
  AND NOT (
    LOWER(title) LIKE '%manager%' OR
    LOWER(title) LIKE '%project%' OR
    LOWER(title) LIKE '%director%' OR
    LOWER(description) LIKE '%management%' OR
    LOWER(description) LIKE '%project%'
  );

-- ============================================================================
-- 10. FILTER AGRICULTURE & OUTDOOR WORK
-- ============================================================================
-- Remove: Farmer, Gardener (agricultural skills, not business school)
-- Keep: Agricultural Consultant, Farm Manager (business roles)
-- Estimated: ~10 jobs
UPDATE jobs
SET 
  is_active = false,
  status = 'inactive',
  filtered_reason = COALESCE(filtered_reason || '; ', '') || 'agriculture_outdoor_work',
  updated_at = NOW()
WHERE is_active = true
  AND (
    LOWER(title) = 'farmer' OR
    LOWER(title) LIKE '%gardener%' OR
    LOWER(title) LIKE '%landscape%' OR
    LOWER(title) LIKE '%forester%'
  )
  -- Keep business-adjacent roles
  AND NOT (
    LOWER(title) LIKE '%agricultural consultant%' OR
    LOWER(title) LIKE '%farm manager%' OR
    LOWER(title) LIKE '%agricultural manager%' OR
    LOWER(description) LIKE '%consulting%' OR
    LOWER(description) LIKE '%management%'
  );

-- ============================================================================
-- 6. VERIFICATION & LOGGING
-- ============================================================================
DO $$ 
DECLARE
  v_active_count INTEGER;
  v_before_count INTEGER := 28285; -- Approximate count from before
  v_percent_remaining NUMERIC;
  v_teaching_count INTEGER;
  v_medical_count INTEGER;
  v_legal_count INTEGER;
  v_construction_count INTEGER;
  v_postal_count INTEGER;
  v_entertainment_count INTEGER;
  v_hospitality_count INTEGER;
  v_sports_count INTEGER;
  v_trades_count INTEGER;
  v_agriculture_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_active_count FROM jobs WHERE is_active = true;
  v_percent_remaining := ROUND(100.0 * v_active_count / v_before_count, 1);
  
  -- Get filter counts
  SELECT COUNT(*) INTO v_teaching_count FROM jobs WHERE filtered_reason LIKE '%teaching_education_role%' AND is_active = false;
  SELECT COUNT(*) INTO v_medical_count FROM jobs WHERE filtered_reason LIKE '%medical_direct_care_role%' AND is_active = false;
  SELECT COUNT(*) INTO v_legal_count FROM jobs WHERE filtered_reason LIKE '%practicing_legal_role%' AND is_active = false;
  SELECT COUNT(*) INTO v_construction_count FROM jobs WHERE filtered_reason LIKE '%construction_manual_labor%' AND is_active = false;
  SELECT COUNT(*) INTO v_postal_count FROM jobs WHERE filtered_reason LIKE '%postal_delivery_operational%' AND is_active = false;
  SELECT COUNT(*) INTO v_entertainment_count FROM jobs WHERE filtered_reason LIKE '%entertainment_artistic_role%' AND is_active = false;
  SELECT COUNT(*) INTO v_hospitality_count FROM jobs WHERE filtered_reason LIKE '%hospitality_food_service%' AND is_active = false;
  SELECT COUNT(*) INTO v_sports_count FROM jobs WHERE filtered_reason LIKE '%sports_fitness_role%' AND is_active = false;
  SELECT COUNT(*) INTO v_trades_count FROM jobs WHERE filtered_reason LIKE '%skilled_mechanical_trade%' AND is_active = false;
  SELECT COUNT(*) INTO v_agriculture_count FROM jobs WHERE filtered_reason LIKE '%agriculture_outdoor_work%' AND is_active = false;
  
  -- Check if we've lost too many (safety threshold: >2% means something went wrong)
  IF v_percent_remaining < 98 THEN
    RAISE WARNING 'WARNING: Only %.1% of jobs remain (filtered more than 2%)', v_percent_remaining;
  END IF;
  
  -- Log summary
  RAISE NOTICE '=== COMPREHENSIVE NON-BUSINESS FILTER COMPLETE ===';
  RAISE NOTICE 'Active jobs remaining: % (%.1% of original)', v_active_count, v_percent_remaining;
  RAISE NOTICE '=== BASIC FILTERS ===';
  RAISE NOTICE 'Teaching/Education roles filtered: %', v_teaching_count;
  RAISE NOTICE 'Medical direct care roles filtered: %', v_medical_count;
  RAISE NOTICE 'Practicing legal roles filtered: %', v_legal_count;
  RAISE NOTICE 'Construction/manual labor filtered: %', v_construction_count;
  RAISE NOTICE 'Postal/delivery operational filtered: %', v_postal_count;
  RAISE NOTICE '=== EXTENDED FILTERS ===';
  RAISE NOTICE 'Entertainment/Artistic roles filtered: %', v_entertainment_count;
  RAISE NOTICE 'Hospitality/Food service filtered: %', v_hospitality_count;
  RAISE NOTICE 'Sports/Fitness roles filtered: %', v_sports_count;
  RAISE NOTICE 'Skilled mechanical trades filtered: %', v_trades_count;
  RAISE NOTICE 'Agriculture/Outdoor work filtered: %', v_agriculture_count;
  RAISE NOTICE '=== TOTAL ===';
  RAISE NOTICE 'Total non-business jobs filtered: %', 
    v_teaching_count + v_medical_count + v_legal_count + v_construction_count + 
    v_postal_count + v_entertainment_count + v_hospitality_count + v_sports_count + 
    v_trades_count + v_agriculture_count;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run manually to check results)
-- ============================================================================

-- Check what was filtered:
-- SELECT
--     filtered_reason,
--     COUNT(*) as job_count
-- FROM jobs
-- WHERE is_active = false AND filtered_reason LIKE '%teaching%' 
--    OR filtered_reason LIKE '%medical%'
--    OR filtered_reason LIKE '%legal%'
--    OR filtered_reason LIKE '%construction%'
--    OR filtered_reason LIKE '%postal%'
-- GROUP BY filtered_reason
-- ORDER BY job_count DESC;

-- Check final active job count:
-- SELECT COUNT(*) as active_jobs FROM jobs WHERE is_active = true;

-- Sample remaining jobs (sanity check):
-- SELECT id, title, company, city, categories FROM jobs WHERE is_active = true LIMIT 20;