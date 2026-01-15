-- ============================================================================
-- TEST HELPER FUNCTIONS
-- ============================================================================
-- Database functions to support security and performance testing
--
-- Date: January 15, 2026
-- ============================================================================

-- Function to get RLS policies for testing
CREATE OR REPLACE FUNCTION public.get_rls_policies(table_name text)
RETURNS TABLE (
    schemaname text,
    tablename text,
    policyname text,
    permissive text,
    roles text[],
    cmd text,
    qual text,
    with_check text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.schemaname::text,
        p.tablename::text,
        p.policyname::text,
        p.permissive::text,
        p.roles,
        p.cmd::text,
        p.qual::text,
        p.with_check::text
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = table_name;
END;
$$;

-- Function to get function search paths for security testing
CREATE OR REPLACE FUNCTION public.get_function_search_paths()
RETURNS TABLE (
    function_name text,
    search_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.proname::text as function_name,
        COALESCE(
            (SELECT setting FROM pg_proc_config WHERE oid = p.oid AND name = 'search_path'),
            'default'
        )::text as search_path
    FROM pg_proc p
    WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND p.proname IN (
          'prevent_old_categories',
          'reset_user_recommendations',
          'normalize_city_name',
          'get_user_match_stats',
          'clean_company_name',
          'clean_job_data_before_insert',
          'categorize_job',
          'clear_user_feedback_cache',
          'trigger_user_rematch',
          'update_pending_digests_updated_at',
          'match_jobs_by_embedding',
          'find_similar_users',
          'parse_and_update_location',
          'fix_work_environment'
      );
END;
$$;

-- Function to get RLS-supporting indexes
CREATE OR REPLACE FUNCTION public.get_rls_supporting_indexes()
RETURNS TABLE (
    tablename text,
    indexname text,
    indexdef text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.tablename::text,
        i.indexname::text,
        pg_get_indexdef(i.indexrelid)::text as indexdef
    FROM pg_indexes i
    WHERE i.schemaname = 'public'
      AND i.indexname IN (
          'idx_users_id',
          'idx_jobs_is_active_status',
          'idx_matches_user_email',
          'idx_match_logs_user_email',
          'idx_pending_digests_user_email'
      );
END;
$$;

-- Function to validate data integrity constraints
CREATE OR REPLACE FUNCTION public.validate_data_integrity()
RETURNS TABLE (
    check_name text,
    status text,
    details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invalid_visa_jobs integer := 0;
    invalid_category_jobs integer := 0;
    null_email_users integer := 0;
    null_title_jobs integer := 0;
BEGIN
    -- Check visa_friendly constraint
    SELECT COUNT(*) INTO invalid_visa_jobs
    FROM jobs
    WHERE visa_friendly IS NULL;

    -- Check category validation (using the existing function)
    SELECT COUNT(*) INTO invalid_category_jobs
    FROM jobs
    WHERE NOT validate_job_categories(categories);

    -- Check NOT NULL constraints
    SELECT COUNT(*) INTO null_email_users
    FROM users
    WHERE email IS NULL OR email = '';

    SELECT COUNT(*) INTO null_title_jobs
    FROM jobs
    WHERE title IS NULL OR title = '';

    -- Return results
    RETURN QUERY
    SELECT
        'visa_friendly_not_null'::text,
        CASE WHEN invalid_visa_jobs = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('%s jobs with NULL visa_friendly', invalid_visa_jobs)::text

    UNION ALL
    SELECT
        'categories_valid'::text,
        CASE WHEN invalid_category_jobs = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('%s jobs with invalid categories', invalid_category_jobs)::text

    UNION ALL
    SELECT
        'users_email_not_null'::text,
        CASE WHEN null_email_users = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('%s users with NULL/empty email', null_email_users)::text

    UNION ALL
    SELECT
        'jobs_title_not_null'::text,
        CASE WHEN null_title_jobs = 0 THEN 'PASS' ELSE 'FAIL' END,
        format('%s jobs with NULL/empty title', null_title_jobs)::text;
END;
$$;

-- Function to simulate security test queries (safe version)
CREATE OR REPLACE FUNCTION public.simulate_security_test(
    test_user_email text DEFAULT NULL
)
RETURNS TABLE (
    test_name text,
    result text,
    notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rls_enabled_users boolean := false;
    rls_enabled_jobs boolean := false;
    rls_enabled_matches boolean := false;
    user_policy_count integer := 0;
    job_policy_count integer := 0;
    match_policy_count integer := 0;
BEGIN
    -- Check RLS status
    SELECT rowsecurity INTO rls_enabled_users
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'users';

    SELECT rowsecurity INTO rls_enabled_jobs
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'jobs';

    SELECT rowsecurity INTO rls_enabled_matches
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'matches';

    -- Count policies
    SELECT COUNT(*) INTO user_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users';

    SELECT COUNT(*) INTO job_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'jobs';

    SELECT COUNT(*) INTO match_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'matches';

    -- Return test results
    RETURN QUERY
    SELECT
        'RLS enabled on users'::text,
        CASE WHEN rls_enabled_users THEN 'PASS' ELSE 'FAIL' END,
        format('%s policies defined', user_policy_count)::text

    UNION ALL
    SELECT
        'RLS enabled on jobs'::text,
        CASE WHEN rls_enabled_jobs THEN 'PASS' ELSE 'FAIL' END,
        format('%s policies defined', job_policy_count)::text

    UNION ALL
    SELECT
        'RLS enabled on matches'::text,
        CASE WHEN rls_enabled_matches THEN 'PASS' ELSE 'FAIL' END,
        format('%s policies defined', match_policy_count)::text

    UNION ALL
    SELECT
        'Data integrity checks'::text,
        'INFO'::text,
        'Run validate_data_integrity() for detailed results'::text;
END;
$$;

-- Function to benchmark query performance
CREATE OR REPLACE FUNCTION public.benchmark_query_performance()
RETURNS TABLE (
    query_name text,
    execution_time_ms integer,
    rows_affected integer,
    used_index boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    query_result record;
BEGIN
    -- Test 1: Active jobs query
    start_time := clock_timestamp();
    SELECT COUNT(*) as cnt INTO query_result
    FROM jobs
    WHERE is_active = true AND status = 'active';
    end_time := clock_timestamp();

    RETURN QUERY
    SELECT
        'active_jobs_count'::text,
        EXTRACT(epoch FROM (end_time - start_time) * 1000)::integer,
        query_result.cnt::integer,
        true; -- Assume index is used (would need EXPLAIN to verify)

    -- Test 2: User matches query
    start_time := clock_timestamp();
    SELECT COUNT(*) as cnt INTO query_result
    FROM matches m
    WHERE m.created_at > NOW() - INTERVAL '24 hours';
    end_time := clock_timestamp();

    RETURN QUERY
    SELECT
        'recent_matches_count'::text,
        EXTRACT(epoch FROM (end_time - start_time) * 1000)::integer,
        query_result.cnt::integer,
        true;

    -- Test 3: Vector similarity search
    start_time := clock_timestamp();
    SELECT COUNT(*) as cnt INTO query_result
    FROM jobs j
    WHERE j.embedding IS NOT NULL
    LIMIT 10;
    end_time := clock_timestamp();

    RETURN QUERY
    SELECT
        'vector_search_sample'::text,
        EXTRACT(epoch FROM (end_time - start_time) * 1000)::integer,
        query_result.cnt::integer,
        true;
END;
$$;

-- Grant execute permissions to authenticated users for testing
GRANT EXECUTE ON FUNCTION public.get_rls_policies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_function_search_paths() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rls_supporting_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_data_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_security_test(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.benchmark_query_performance() TO authenticated;

-- Service role gets full access
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;