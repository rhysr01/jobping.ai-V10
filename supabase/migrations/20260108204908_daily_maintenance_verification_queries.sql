-- ============================================================================
-- VERIFICATION QUERIES FOR DAILY MAINTENANCE
-- ============================================================================
-- Run these queries after applying the maintenance migration to check status
-- ============================================================================

-- Data Quality Checks
SELECT
  'Data Quality' as check_type,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN company_name IS NULL AND company IS NOT NULL THEN 1 END) as missing_company_name,
  COUNT(CASE WHEN (city IS NULL OR city = '') AND (country IS NULL OR country = '') THEN 1 END) as missing_both_location,
  COUNT(CASE WHEN (city IS NULL OR city = '') AND (country IS NOT NULL AND country != '') THEN 1 END) as missing_city_has_country,
  COUNT(CASE WHEN (country IS NULL OR country = '') AND (city IS NOT NULL AND city != '') THEN 1 END) as missing_country_has_city,
  COUNT(CASE WHEN description IS NULL OR LENGTH(description) < 20 THEN 1 END) as short_descriptions,
  COUNT(CASE WHEN categories IS NULL OR array_length(categories, 1) IS NULL THEN 1 END) as empty_categories,
  COUNT(CASE WHEN posted_at IS NULL THEN 1 END) as missing_posted_at
FROM jobs
WHERE is_active = true;

-- Job Board Status
SELECT
  'Job Board Status' as check_type,
  COUNT(*) as total_job_boards,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_job_boards,
  COUNT(CASE WHEN filtered_reason LIKE '%job_board_as_company%' THEN 1 END) as flagged
FROM jobs
WHERE company IN ('Reed', 'Reed Recruitment', 'Indeed', 'Google', 'StepStone Group', 'StepStone', 'eFinancialCareers', 'efinancial')
   OR company ILIKE '%indeed%' OR company ILIKE '%reed%' OR company ILIKE '%efinancial%';

-- Old Category Names Check
SELECT
  'Old Categories' as check_type,
  unnest(categories) as category,
  COUNT(*) as job_count
FROM jobs
WHERE categories && ARRAY['marketing-advertising', 'finance-accounting', 'sales-business-development', 'product-management']::text[]
GROUP BY unnest(categories)
ORDER BY job_count DESC;

-- Check RLS status
SELECT
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('free_signups_analytics', 'analytics_events', 'free_sessions',
                    'scraping_priorities', 'custom_scans', 'fallback_match_events')
ORDER BY tablename;

-- Check indexes
SELECT
  'Index Status' as check_type,
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('idx_api_key_usage_api_key_id', 'idx_api_keys_user_id')
ORDER BY tablename, indexname;

-- Check function search_path
SELECT
  'Function Security' as check_type,
  proname as function_name,
  proconfig as search_path_config
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'prevent_old_categories', 'reset_user_recommendations', 'normalize_city_name',
    'get_user_match_stats', 'clean_company_name', 'clean_job_data_before_insert',
    'categorize_job', 'clear_user_feedback_cache', 'trigger_user_rematch',
    'update_pending_digests_updated_at'
  )
ORDER BY proname;

-- Location Normalization Check
SELECT
  'Location Quality' as check_type,
  COUNT(CASE WHEN city IN ('España', 'Deutschland', 'United Kingdom', 'UK', 'Germany', 'Spain') THEN 1 END) as country_names_in_city,
  COUNT(CASE WHEN country ILIKE '%deutschland%' OR country ILIKE '%españa%' THEN 1 END) as unnormalized_countries,
  COUNT(CASE WHEN city ILIKE '%münchen%' OR city ILIKE '%wien%' OR city ILIKE '%praha%' THEN 1 END) as unnormalized_cities
FROM jobs
WHERE is_active = true;

-- Company Name Quality Check
SELECT
  'Company Quality' as check_type,
  COUNT(CASE WHEN company LIKE '%Ltd%' OR company LIKE '%Inc%' OR company LIKE '%GmbH%' THEN 1 END) as companies_with_suffixes,
  COUNT(CASE WHEN company_name LIKE '%Ltd%' OR company_name LIKE '%Inc%' OR company_name LIKE '%GmbH%' THEN 1 END) as company_names_with_suffixes
FROM jobs
WHERE is_active = true;

-- Non-Business Role Filtering Check
SELECT
  'Non-Business Roles Filtered' as check_type,
  COUNT(CASE WHEN filtered_reason LIKE '%ceo_executive_role%' THEN 1 END) as ceo_executive_filtered,
  COUNT(CASE WHEN filtered_reason LIKE '%construction_role%' THEN 1 END) as construction_filtered,
  COUNT(CASE WHEN filtered_reason LIKE '%medical_healthcare_role%' THEN 1 END) as medical_filtered,
  COUNT(CASE WHEN filtered_reason LIKE '%legal_role%' THEN 1 END) as legal_filtered,
  COUNT(CASE WHEN filtered_reason LIKE '%teaching_education_role%' THEN 1 END) as teaching_filtered,
  COUNT(CASE WHEN filtered_reason LIKE '%categorization_review_needed%' THEN 1 END) as categorization_review_needed
FROM jobs
WHERE is_active = false
  AND filtered_reason IS NOT NULL;

-- Active Jobs That Should Be Filtered (Leak Detection)
SELECT
  'Potential Leaks' as check_type,
  COUNT(CASE WHEN (LOWER(title) LIKE '%ceo%' OR LOWER(title) LIKE '%chief executive%' OR LOWER(title) LIKE '%managing director%') AND is_active = true THEN 1 END) as active_ceo_jobs,
  COUNT(CASE WHEN (LOWER(title) LIKE '%construction%' OR LOWER(title) LIKE '%builder%' OR LOWER(title) LIKE '%carpenter%') AND is_active = true THEN 1 END) as active_construction_jobs,
  COUNT(CASE WHEN (LOWER(title) LIKE '%nurse%' OR LOWER(title) LIKE '%doctor%' OR LOWER(title) LIKE '%physician%') AND is_active = true THEN 1 END) as active_medical_jobs,
  COUNT(CASE WHEN (LOWER(title) LIKE '%lawyer%' OR LOWER(title) LIKE '%attorney%' OR LOWER(title) LIKE '%solicitor%') AND is_active = true THEN 1 END) as active_legal_jobs,
  COUNT(CASE WHEN (LOWER(title) LIKE '%teacher%' OR LOWER(title) LIKE '%lecturer%' OR LOWER(title) LIKE '%professor%') AND is_active = true THEN 1 END) as active_teaching_jobs
FROM jobs
WHERE status = 'active'
  AND filtered_reason IS NULL;

-- Categorization Accuracy Check
SELECT
  'Categorization Accuracy' as check_type,
  COUNT(CASE WHEN 'early-career' = ANY(categories) AND (LOWER(title) LIKE '%senior%' OR LOWER(title) LIKE '%director%' OR LOWER(title) LIKE '%chief%') AND is_active = true THEN 1 END) as senior_jobs_with_early_career_tag,
  COUNT(CASE WHEN (LOWER(title) LIKE '%construction%' OR LOWER(title) LIKE '%builder%') AND ('finance-investment' = ANY(categories) OR 'marketing-growth' = ANY(categories)) AND is_active = true THEN 1 END) as construction_jobs_with_business_categories,
  COUNT(CASE WHEN (LOWER(title) LIKE '%nurse%' OR LOWER(title) LIKE '%doctor%') AND ('finance-investment' = ANY(categories) OR 'marketing-growth' = ANY(categories)) AND is_active = true THEN 1 END) as medical_jobs_with_business_categories
FROM jobs
WHERE status = 'active'
  AND filtered_reason IS NULL;

-- Overall Health Summary
SELECT
  'Health Summary' as check_type,
  (SELECT COUNT(*) FROM jobs WHERE company IN ('Reed', 'Indeed', 'Google') AND is_active = true) as active_job_boards,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
    AND tablename IN ('free_signups_analytics', 'analytics_events', 'free_sessions',
                      'scraping_priorities', 'custom_scans', 'fallback_match_events')
    AND rowsecurity = false) as tables_without_rls,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'
    AND indexname IN ('idx_api_key_usage_api_key_id', 'idx_api_keys_user_id')) as indexes_created,
  (SELECT COUNT(*) FROM jobs WHERE is_active = true
    AND (
      (company_name IS NULL OR company_name = '') AND company IS NOT NULL AND company != ''
      OR (city IS NULL OR city = '') AND (country IS NULL OR country = '')  -- Both missing is an issue
      OR description IS NULL OR LENGTH(description) < 20
      OR categories IS NULL OR array_length(categories, 1) IS NULL
      OR posted_at IS NULL
    )) as data_quality_issues;
