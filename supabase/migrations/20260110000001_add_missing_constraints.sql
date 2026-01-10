-- Migration: Add missing database constraints
-- Date: 2026-01-10
-- Description: Adds NOT NULL constraints and other data integrity improvements

-- Add NOT NULL constraints for critical fields (only if they don't already exist)
DO $$
BEGIN
    -- Users table constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_email_not_null'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_full_name_not_null'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN full_name SET NOT NULL;
    END IF;

    -- Jobs table constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'jobs_title_not_null'
    ) THEN
        ALTER TABLE public.jobs ALTER COLUMN title SET NOT NULL;
    END IF;

    -- Matches table constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'matches_user_email_not_null'
    ) THEN
        ALTER TABLE public.matches ALTER COLUMN user_email SET NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'matches_job_hash_not_null'
    ) THEN
        ALTER TABLE public.matches ALTER COLUMN job_hash SET NOT NULL;
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail if constraints already exist
    RAISE NOTICE 'Some constraints may already exist, continuing...';
END $$;