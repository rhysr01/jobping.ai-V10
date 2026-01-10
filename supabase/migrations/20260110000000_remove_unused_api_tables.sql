-- Migration: Remove unused API key tables
-- Date: 2026-01-10
-- Description: Removes api_keys and api_key_usage tables that are not used in the application

-- Remove foreign key constraint first
ALTER TABLE public.api_key_usage DROP CONSTRAINT IF EXISTS api_key_usage_api_key_id_fkey;

-- Drop the tables (they exist in schema but are never queried in application code)
DROP TABLE IF EXISTS public.api_key_usage;
DROP TABLE IF EXISTS public.api_keys;

-- Remove any associated indexes (should be cleaned up automatically, but being explicit)
DROP INDEX IF EXISTS public.idx_api_key_usage_api_key_id;
DROP INDEX IF EXISTS public.idx_api_keys_user_id;