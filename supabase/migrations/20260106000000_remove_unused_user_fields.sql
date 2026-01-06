-- Remove unused user preference fields from database
-- These fields are not used anywhere in the codebase

ALTER TABLE users
DROP COLUMN IF EXISTS cv_url,
DROP COLUMN IF EXISTS professional_experience,
DROP COLUMN IF EXISTS target_employment_start_date,
DROP COLUMN IF EXISTS verification_token,
DROP COLUMN IF EXISTS verification_token_expires;

-- Add comment about what was removed
COMMENT ON TABLE users IS 'User table - removed unused fields: cv_url, professional_experience, target_employment_start_date, verification_token, verification_token_expires';
