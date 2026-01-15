-- ============================================================================
-- CRITICAL SECURITY FIXES - PRIORITY 1
-- ============================================================================
-- This migration addresses the critical RLS vulnerabilities identified in the audit
-- Date: January 15, 2026
-- Priority: CRITICAL - Execute immediately
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENABLE RLS ON CORE TABLES (Critical Security Fix)
-- ============================================================================

DO $$
BEGIN
  -- Enable RLS on users table (currently unprotected!)
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND rowsecurity = true
  ) THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on users table';
  END IF;

  -- Enable RLS on jobs table (currently unprotected!)
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'jobs'
      AND rowsecurity = true
  ) THEN
    ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on jobs table';
  END IF;

  -- Enable RLS on matches table (currently unprotected!)
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'matches'
      AND rowsecurity = true
  ) THEN
    ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on matches table';
  END IF;

  -- Enable RLS on match_logs table
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'match_logs'
      AND rowsecurity = true
  ) THEN
    ALTER TABLE public.match_logs ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on match_logs table';
  END IF;

  -- Enable RLS on pending_digests table
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'pending_digests'
      AND rowsecurity = true
  ) THEN
    ALTER TABLE public.pending_digests ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on pending_digests table';
  END IF;
END $$;

-- ============================================================================
-- 2. IMPLEMENT ACCESS POLICIES (Critical Security Fix)
-- ============================================================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can access own data" ON public.users;
CREATE POLICY "Users can access own data" ON public.users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role full access to users (for admin operations)
DROP POLICY IF EXISTS "Service role full access to users" ON public.users;
CREATE POLICY "Service role full access to users" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- JOBS TABLE POLICIES
-- Jobs are readable by authenticated users (but only active jobs)
DROP POLICY IF EXISTS "Authenticated users can read active jobs" ON public.jobs;
CREATE POLICY "Authenticated users can read active jobs" ON public.jobs
  FOR SELECT
  TO authenticated
  USING (is_active = true AND status = 'active');

-- Service role full access to jobs
DROP POLICY IF EXISTS "Service role full access to jobs" ON public.jobs;
CREATE POLICY "Service role full access to jobs" ON public.jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- MATCHES TABLE POLICIES
-- Users can only see their own matches
DROP POLICY IF EXISTS "Users can access own matches" ON public.matches;
CREATE POLICY "Users can access own matches" ON public.matches
  FOR ALL
  TO authenticated
  USING (user_email = (select auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (select auth.jwt() ->> 'email'));

-- Service role full access to matches
DROP POLICY IF EXISTS "Service role full access to matches" ON public.matches;
CREATE POLICY "Service role full access to matches" ON public.matches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- MATCH_LOGS TABLE POLICIES
-- Users can only see their own match logs
DROP POLICY IF EXISTS "Users can access own match logs" ON public.match_logs;
CREATE POLICY "Users can access own match logs" ON public.match_logs
  FOR ALL
  TO authenticated
  USING (user_email = (select auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (select auth.jwt() ->> 'email'));

-- Service role full access to match_logs
DROP POLICY IF EXISTS "Service role full access to match_logs" ON public.match_logs;
CREATE POLICY "Service role full access to match_logs" ON public.match_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- PENDING_DIGESTS TABLE POLICIES
-- Users can only see their own pending digests
DROP POLICY IF EXISTS "Users can access own pending digests" ON public.pending_digests;
CREATE POLICY "Users can access own pending digests" ON public.pending_digests
  FOR ALL
  TO authenticated
  USING (user_email = (select auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (select auth.jwt() ->> 'email'));

-- Service role full access to pending_digests
DROP POLICY IF EXISTS "Service role full access to pending_digests" ON public.pending_digests;
CREATE POLICY "Service role full access to pending_digests" ON public.pending_digests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. ADD ADDITIONAL SECURITY INDEXES (Performance + Security)
-- ============================================================================

-- Add indexes to support RLS policies efficiently
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active_status ON public.jobs(is_active, status);
CREATE INDEX IF NOT EXISTS idx_matches_user_email ON public.matches(user_email);
CREATE INDEX IF NOT EXISTS idx_match_logs_user_email ON public.match_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_pending_digests_user_email ON public.pending_digests(user_email);

-- ============================================================================
-- 4. VALIDATION QUERIES (Run after migration to verify)
-- ============================================================================

DO $$
DECLARE
  users_rls boolean;
  jobs_rls boolean;
  matches_rls boolean;
BEGIN
  -- Check RLS is enabled
  SELECT rowsecurity INTO users_rls FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'users';

  SELECT rowsecurity INTO jobs_rls FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'jobs';

  SELECT rowsecurity INTO matches_rls FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'matches';

  RAISE NOTICE 'RLS Status - users: %, jobs: %, matches: %',
    users_rls, jobs_rls, matches_rls;

  IF NOT (users_rls AND jobs_rls AND matches_rls) THEN
    RAISE EXCEPTION 'CRITICAL: RLS not properly enabled on all core tables!';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run manually after deployment)
-- ============================================================================

/*
-- Verify RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'jobs', 'matches', 'match_logs', 'pending_digests')
ORDER BY tablename;

-- Verify policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'jobs', 'matches', 'match_logs', 'pending_digests')
ORDER BY tablename, policyname;

-- Test policy effectiveness (run as authenticated user)
-- This should return 0 rows if policies work correctly:
SELECT COUNT(*) FROM users; -- Should be 0 (can't see other users)
SELECT COUNT(*) FROM matches WHERE user_email != (select auth.jwt() ->> 'email'); -- Should be 0
*/