-- ============================================================================
-- REMOVE USERS WITH RHYS OR ROWLANDS IN EMAIL
-- ============================================================================
-- Safely removes all users whose email contains 'rhys' or 'rowlands'
-- Handles foreign key constraints by deleting child records first
--
-- Date: January 9, 2026
-- ============================================================================

BEGIN;

-- First, collect the user emails to be removed for logging
CREATE TEMP TABLE users_to_remove AS
SELECT email, id
FROM public.users
WHERE LOWER(email) LIKE '%rhys%'
   OR LOWER(email) LIKE '%rowlands%';

-- Log the users being removed
DO $$
DECLARE
    user_record RECORD;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM users_to_remove;
    RAISE NOTICE 'Found % users to remove:', total_count;

    FOR user_record IN SELECT email FROM users_to_remove ORDER BY email
    LOOP
        RAISE NOTICE '  - %', user_record.email;
    END LOOP;
END $$;

-- Delete from tables that reference users (in reverse dependency order)

-- 1. Delete from custom_scans (references users.email)
DELETE FROM public.custom_scans
WHERE user_email IN (SELECT email FROM users_to_remove);

-- 2. Delete from fallback_match_events (references users.email)
DELETE FROM public.fallback_match_events
WHERE user_email IN (SELECT email FROM users_to_remove);

-- 3. Delete from match_logs (references users.email)
DELETE FROM public.match_logs
WHERE user_email IN (SELECT email FROM users_to_remove);

-- 4. Delete from matches (references users.email)
DELETE FROM public.matches
WHERE user_email IN (SELECT email FROM users_to_remove);

-- 5. Delete from pending_digests (references users.email)
DELETE FROM public.pending_digests
WHERE user_email IN (SELECT email FROM users_to_remove);

-- 6. Delete from stripe_connect_accounts (references users.id)
DELETE FROM public.stripe_connect_accounts
WHERE user_id IN (SELECT id FROM users_to_remove);

-- 7. Delete from free_sessions (check if it references users)
-- Note: free_sessions might reference user_email or user_id - adjust as needed
DELETE FROM public.free_sessions
WHERE user_email IN (SELECT email FROM users_to_remove)
   OR user_id IN (SELECT id FROM users_to_remove);

-- 8. Delete from analytics_events (check if it references users)
-- Note: analytics_events might reference user_email or user_id - adjust as needed
DELETE FROM public.analytics_events
WHERE user_email IN (SELECT email FROM users_to_remove)
   OR user_id IN (SELECT id FROM users_to_remove);

-- 9. Delete from free_signups_analytics (check if it references users)
-- Note: free_signups_analytics might reference user_email or user_id - adjust as needed
DELETE FROM public.free_signups_analytics
WHERE user_email IN (SELECT email FROM users_to_remove)
   OR user_id IN (SELECT id FROM users_to_remove);

-- Finally, delete the users themselves
DELETE FROM public.users
WHERE email IN (SELECT email FROM users_to_remove);

-- Log completion
DO $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM users_to_remove;
    RAISE NOTICE 'Successfully removed % users and all their associated data', total_count;
END $$;

-- Clean up temp table
DROP TABLE users_to_remove;

COMMIT;
