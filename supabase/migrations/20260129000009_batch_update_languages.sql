-- ============================================================================
-- BATCH UPDATE LANGUAGE REQUIREMENTS FOR EXISTING JOBS
-- Date: January 29, 2026
-- Purpose: Update existing jobs in batches to extract all 40+ languages
--          Process in smaller chunks to avoid timeouts
-- ============================================================================

BEGIN;

-- Batch 1: Update jobs with English, French, German, Spanish, Italian, Dutch, Portuguese
UPDATE jobs
SET language_requirements = (
    SELECT ARRAY_AGG(DISTINCT lang)
    FROM (
        SELECT 'English' as lang WHERE LOWER(COALESCE(description, '')) ~ '\y(english|fluent\s+english|english\s+required|english\s+language|english\s+proficiency|english\s+speaking|english\s+written|native\s+english|english\s+native|business\s+english|must\s+speak\s+english|english\s+is\s+a\s+must|proficiency\s+in\s+english)\y'
        UNION SELECT 'French' WHERE LOWER(COALESCE(description, '')) ~ '\y(french|français|francais|fluent\s+french|french\s+required|french\s+language|french\s+proficiency|french\s+speaking|french\s+written|native\s+french|french\s+native|business\s+french|francophone|must\s+speak\s+french|french\s+is\s+a\s+must|proficiency\s+in\s+french|français\s+requis)\y'
        UNION SELECT 'German' WHERE LOWER(COALESCE(description, '')) ~ '\y(german|deutsch|fluent\s+german|german\s+required|german\s+language|german\s+proficiency|german\s+speaking|german\s+written|native\s+german|german\s+native|business\s+german|deutschkenntnisse|deutschsprachig|must\s+speak\s+german|german\s+is\s+a\s+must|proficiency\s+in\s+german|deutsch\s+erforderlich)\y'
        UNION SELECT 'Spanish' WHERE LOWER(COALESCE(description, '')) ~ '\y(spanish|español|espanol|fluent\s+spanish|spanish\s+required|spanish\s+language|spanish\s+proficiency|spanish\s+speaking|spanish\s+written|native\s+spanish|spanish\s+native|business\s+spanish|hispanohablante|must\s+speak\s+spanish|spanish\s+is\s+a\s+must|proficiency\s+in\s+spanish|español\s+requerido)\y'
        UNION SELECT 'Italian' WHERE LOWER(COALESCE(description, '')) ~ '\y(italian|italiano|fluent\s+italian|italian\s+required|italian\s+language|italian\s+proficiency|italian\s+speaking|italian\s+written|native\s+italian|italian\s+native|business\s+italian|must\s+speak\s+italian|italian\s+is\s+a\s+must|proficiency\s+in\s+italian|italiano\s+richiesto)\y'
        UNION SELECT 'Dutch' WHERE LOWER(COALESCE(description, '')) ~ '\y(dutch|nederlands|fluent\s+dutch|dutch\s+required|dutch\s+language|dutch\s+proficiency|dutch\s+speaking|dutch\s+written|native\s+dutch|dutch\s+native|business\s+dutch|nederlandstalig|must\s+speak\s+dutch|dutch\s+is\s+a\s+must|proficiency\s+in\s+dutch|nederlands\s+vereist)\y'
        UNION SELECT 'Portuguese' WHERE LOWER(COALESCE(description, '')) ~ '\y(portuguese|português|portugues|fluent\s+portuguese|portuguese\s+required|portuguese\s+language|portuguese\s+proficiency|portuguese\s+speaking|portuguese\s+written|native\s+portuguese|portuguese\s+native|business\s+portuguese)\y'
    ) languages
)
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) IS NULL)
  AND description IS NOT NULL
  AND description != ''
  AND is_active = true
  AND status = 'active'
  AND id IN (
    SELECT id FROM jobs 
    WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) IS NULL)
      AND description IS NOT NULL
      AND description != ''
      AND is_active = true
      AND status = 'active'
    ORDER BY id
    LIMIT 5000
  );

COMMIT;

