-- Add filtered_reason column to jobs table
-- This column tracks why jobs were filtered out during data quality improvements
-- Date: 2026-01-20

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'jobs' AND column_name = 'filtered_reason') THEN
        ALTER TABLE public.jobs ADD COLUMN filtered_reason TEXT;
        CREATE INDEX IF NOT EXISTS idx_jobs_filtered_reason ON public.jobs(filtered_reason) WHERE filtered_reason IS NOT NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.jobs.filtered_reason IS 'Reason why this job was filtered out during data quality processing';