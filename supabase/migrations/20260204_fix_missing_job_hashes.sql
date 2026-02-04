-- Fix Missing Job Hashes Migration
-- Problem: 69% of jobs missing job_hash values causing free signup failures
-- Solution: Generate unique hashes for all missing jobs

-- Create a function to generate job hashes safely
CREATE OR REPLACE FUNCTION generate_job_hash(
  job_id uuid,
  job_title text,
  job_company text,
  job_location text
) RETURNS text AS $$
BEGIN
  RETURN encode(
    digest(
      CONCAT(
        job_id::text, '|',
        COALESCE(job_title, ''), '|',
        COALESCE(job_company, ''), '|',
        COALESCE(job_location, '')
      ),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql;

-- Update jobs in batches to avoid timeouts
-- This will be run multiple times until all jobs are fixed

UPDATE jobs 
SET job_hash = generate_job_hash(id, title, company, location)
WHERE job_hash IS NULL 
  AND is_active = true 
  AND status = 'active'
  AND id IN (
    SELECT id FROM jobs 
    WHERE job_hash IS NULL 
      AND is_active = true 
      AND status = 'active' 
    LIMIT 1000
  );

-- Clean up the function
DROP FUNCTION generate_job_hash(uuid, text, text, text);