-- Migration: Improve match idempotency and error handling
-- Date: 2025-02-05
-- Purpose: Fix duplicate key value constraint violations on user_matches_unique
-- Issue: Concurrent/retry requests try to insert same matches, violating unique constraint

-- Step 1: Create an idempotency_key column for tracking requests
-- This helps prevent duplicate matches from being inserted on retries
ALTER TABLE public.user_matches 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Step 2: Create a function to safely insert matches with idempotency
-- This function will:
-- 1. Check if idempotency_key already exists
-- 2. Skip if already processed (idempotent)
-- 3. Otherwise insert the matches
CREATE OR REPLACE FUNCTION insert_user_matches_idempotent(
  p_user_id UUID,
  p_matches JSONB,
  p_idempotency_key TEXT
)
RETURNS TABLE (success BOOLEAN, match_count INT, error_message TEXT) AS $$
DECLARE
  v_match JSONB;
  v_inserted INT := 0;
  v_skipped INT := 0;
BEGIN
  -- Check if this idempotency_key was already processed
  IF EXISTS (SELECT 1 FROM user_matches WHERE idempotency_key = p_idempotency_key LIMIT 1) THEN
    -- Already processed - return success with count
    SELECT COUNT(*)::INT INTO v_inserted FROM user_matches 
    WHERE idempotency_key = p_idempotency_key;
    
    RETURN QUERY SELECT 
      true::BOOLEAN,
      v_inserted,
      'Already processed (idempotent)'::TEXT;
    RETURN;
  END IF;

  -- Process each match
  FOR v_match IN SELECT jsonb_array_elements(p_matches)
  LOOP
    BEGIN
      INSERT INTO user_matches (
        user_id,
        job_id,
        match_score,
        match_reason,
        created_at,
        idempotency_key
      ) VALUES (
        p_user_id,
        (v_match->>'job_id')::UUID,
        (v_match->>'match_score')::DECIMAL(3,2),
        v_match->>'match_reason',
        NOW(),
        p_idempotency_key
      )
      ON CONFLICT (user_id, job_id) DO NOTHING;
      
      IF FOUND THEN
        v_inserted := v_inserted + 1;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    EXCEPTION WHEN UNIQUE_VIOLATION THEN
      -- Skip duplicate matches
      v_skipped := v_skipped + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT 
    true::BOOLEAN,
    v_inserted,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Add index on idempotency_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_matches_idempotency_key 
ON public.user_matches(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Step 4: Add comment explaining the issue and fix
COMMENT ON COLUMN public.user_matches.idempotency_key IS 
'Request idempotency key to prevent duplicate matches on retries. Unique constraint prevents processing same request twice.';
