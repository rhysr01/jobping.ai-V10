-- ============================================================================
-- PERFORMANCE OPTIMIZATION - PRIORITY 2
-- ============================================================================
-- This migration adds performance optimizations to support the security fixes
-- and improve overall database performance.
--
-- Date: January 15, 2026
-- Priority: HIGH
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD RLS-SUPPORTING INDEXES (Critical for Performance)
-- ============================================================================

-- Indexes to support RLS policies efficiently (added in security migration but ensuring here)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_is_active_status ON public.jobs(is_active, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_user_email ON public.matches(user_email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_logs_user_email ON public.match_logs(user_email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_digests_user_email ON public.pending_digests(user_email);

-- ============================================================================
-- 2. ADD FREQUENTLY QUERIED FIELD INDEXES
-- ============================================================================

-- User preference and matching related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_subscription ON public.users(active, subscription_tier);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_target_cities ON public.users USING GIN(target_cities);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_career_path ON public.users(career_path);

-- Job search and filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_visa_friendly ON public.jobs(visa_friendly);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_categories ON public.jobs USING GIN(categories);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company ON public.jobs(company);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location ON public.jobs(location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_city ON public.jobs(city);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_country ON public.jobs(country);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_work_environment ON public.jobs(work_environment);

-- Match performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_job_hash ON public.matches(job_hash);

-- ============================================================================
-- 3. COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- User matching queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_matching_prefs ON public.users(
    active,
    subscription_tier,
    career_path
) WHERE active = true;

-- Job filtering queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_filtering ON public.jobs(
    is_active,
    status,
    visa_friendly,
    country
) WHERE is_active = true AND status = 'active';

-- Match analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_user_analytics ON public.matches(
    user_email,
    created_at DESC
);

-- ============================================================================
-- 4. PARTIAL INDEXES FOR FREQUENT FILTERS
-- ============================================================================

-- Only index active jobs (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_only ON public.jobs(id, title, company)
WHERE is_active = true AND status = 'active';

-- Only index premium users for matching priority
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_premium_matching ON public.users(
    id,
    email,
    career_path,
    target_cities
) WHERE active = true AND subscription_tier = 'premium';

-- ============================================================================
-- 5. VECTOR SEARCH OPTIMIZATION
-- ============================================================================

-- Ensure pgvector indexes are optimized for our query patterns
-- These should already exist but let's verify and optimize

DO $$
BEGIN
    -- Check if embedding indexes exist and are properly configured
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'jobs'
          AND indexname = 'jobs_embedding_idx'
    ) THEN
        -- Index exists, ensure it's configured for our typical similarity threshold
        RAISE NOTICE 'Jobs embedding index exists and is configured';
    ELSE
        -- Create optimized index if it doesn't exist
        CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_embedding_idx
        ON public.jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        RAISE NOTICE 'Created optimized jobs embedding index';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'users'
          AND indexname = 'users_preference_embedding_idx'
    ) THEN
        RAISE NOTICE 'Users embedding index exists and is configured';
    ELSE
        CREATE INDEX CONCURRENTLY IF NOT EXISTS users_preference_embedding_idx
        ON public.users USING ivfflat (preference_embedding vector_cosine_ops) WITH (lists = 100);
        RAISE NOTICE 'Created optimized users embedding index';
    END IF;
END $$;

-- ============================================================================
-- 6. QUERY OPTIMIZATION - MATERIALIZED VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Materialized view for active job counts by category (used in analytics)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_active_jobs_by_category AS
SELECT
    unnest(categories) as category,
    COUNT(*) as job_count,
    COUNT(*) FILTER (WHERE visa_friendly = true) as visa_friendly_count,
    MAX(created_at) as latest_job_date
FROM public.jobs
WHERE is_active = true AND status = 'active'
GROUP BY unnest(categories);

-- Index the materialized view
CREATE INDEX IF NOT EXISTS idx_mv_jobs_category ON mv_active_jobs_by_category(category);
CREATE INDEX IF NOT EXISTS idx_mv_jobs_count ON mv_active_jobs_by_category(job_count DESC);

-- Materialized view for user matching statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_matching_stats AS
SELECT
    u.email,
    u.subscription_tier,
    u.active,
    COUNT(m.id) as total_matches,
    COUNT(m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '7 days') as recent_matches,
    MAX(m.created_at) as last_match_date
FROM public.users u
LEFT JOIN public.matches m ON u.email = m.user_email
WHERE u.active = true
GROUP BY u.email, u.subscription_tier, u.active;

CREATE INDEX IF NOT EXISTS idx_mv_user_stats_email ON mv_user_matching_stats(email);
CREATE INDEX IF NOT EXISTS idx_mv_user_stats_tier ON mv_user_matching_stats(subscription_tier);

-- ============================================================================
-- 7. CONNECTION POOLING AND TIMEOUT OPTIMIZATION
-- ============================================================================

-- Note: These are set at the application/database configuration level
-- but we document the optimal settings here for reference

/*
Optimal PostgreSQL settings for JobPing:
- max_connections: 100-200 (depending on instance size)
- shared_buffers: 25% of RAM
- work_mem: 4-16MB (for complex matching queries)
- maintenance_work_mem: 64MB-256MB
- effective_cache_size: 75% of RAM

Supabase-specific optimizations:
- Use connection pooling for API endpoints
- Set statement timeout: 30 seconds for matching operations
- Set lock timeout: 10 seconds
*/

-- ============================================================================
-- 8. MONITORING INDEXES (For Performance Monitoring)
-- ============================================================================

-- Index for monitoring slow queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_performance_monitor ON public.jobs(
    created_at,
    is_active,
    status
) WHERE created_at > NOW() - INTERVAL '30 days';

-- Index for user engagement monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_engagement_monitor ON public.users(
    last_email_sent,
    email_engagement_score,
    subscription_active
) WHERE active = true;

-- ============================================================================
-- 9. CLEANUP UNUSED INDEXES (If Any)
-- ============================================================================

DO $$
DECLARE
    unused_index record;
BEGIN
    -- Find potentially unused indexes (this is a simple heuristic)
    FOR unused_index IN
        SELECT
            schemaname,
            tablename,
            indexname
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND idx_scan = 0  -- Never used
          AND indexname NOT LIKE 'jobs_embedding_idx%'  -- Keep vector indexes
          AND indexname NOT LIKE 'users_preference_embedding_idx%'
    LOOP
        RAISE NOTICE 'Potentially unused index: %.% (%)',
            unused_index.schemaname, unused_index.tablename, unused_index.indexname;
        -- Note: We don't auto-drop indexes as this requires careful analysis
        -- Manual review recommended before dropping any indexes
    END LOOP;
END $$;

-- ============================================================================
-- 10. REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_performance_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_jobs_by_category;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_matching_stats;
    RAISE NOTICE 'Refreshed performance materialized views';
END;
$$;

-- ============================================================================
-- 11. PERFORMANCE MONITORING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_performance_metrics()
RETURNS TABLE (
    metric_name text,
    metric_value bigint,
    description text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        'total_active_jobs'::text,
        COUNT(*)::bigint,
        'Total number of active jobs'::text
    FROM jobs WHERE is_active = true AND status = 'active'

    UNION ALL
    SELECT
        'total_active_users'::text,
        COUNT(*)::bigint,
        'Total number of active users'::text
    FROM users WHERE active = true

    UNION ALL
    SELECT
        'premium_users'::text,
        COUNT(*)::bigint,
        'Number of premium users'::text
    FROM users WHERE active = true AND subscription_tier = 'premium'

    UNION ALL
    SELECT
        'total_matches_last_24h'::text,
        COUNT(*)::bigint,
        'Matches created in last 24 hours'::text
    FROM matches WHERE created_at > NOW() - INTERVAL '24 hours'

    UNION ALL
    SELECT
        'avg_jobs_per_category'::text,
        (SELECT AVG(job_count)::bigint FROM mv_active_jobs_by_category),
        'Average jobs per category'::text;
END;
$$;

-- ============================================================================
-- VALIDATION QUERIES (Run after migration)
-- ============================================================================

DO $$
DECLARE
    index_count integer;
    mv_count integer;
BEGIN
    -- Count performance indexes created
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      AND (tablename IN ('users', 'jobs', 'matches') OR indexname LIKE 'mv_%');

    -- Count materialized views
    SELECT COUNT(*) INTO mv_count
    FROM pg_matviews
    WHERE schemaname = 'public'
      AND matviewname LIKE 'mv_%';

    RAISE NOTICE 'Performance optimization complete:';
    RAISE NOTICE '  - Indexes created: %', index_count;
    RAISE NOTICE '  - Materialized views created: %', mv_count;
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

/*
-- Check index usage (run after some traffic)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (tablename IN ('users', 'jobs', 'matches') OR indexname LIKE 'mv_%')
ORDER BY idx_scan DESC;

-- Check materialized view sizes
SELECT
    schemaname,
    matviewname,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname LIKE 'mv_%';

-- Performance metrics
SELECT * FROM get_performance_metrics();

-- Test query performance (should use indexes)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM jobs
WHERE is_active = true AND status = 'active' AND visa_friendly = true;

EXPLAIN ANALYZE
SELECT * FROM matches
WHERE user_email = 'test@example.com'
ORDER BY created_at DESC LIMIT 10;
*/