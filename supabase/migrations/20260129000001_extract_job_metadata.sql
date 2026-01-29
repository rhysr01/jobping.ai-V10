-- ============================================================================
-- EXTRACT JOB METADATA FROM DESCRIPTIONS
-- Date: January 29, 2026
-- Purpose: Extract visa sponsorship, remote work, salary, and language requirements
--          from job descriptions using database triggers
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENHANCE TRIGGER FUNCTION WITH METADATA EXTRACTION
-- ============================================================================

-- Update the existing clean_job_data_before_insert() function
-- to extract metadata from descriptions
CREATE OR REPLACE FUNCTION clean_job_data_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    desc_lower TEXT;
BEGIN
    -- Normalize city
    IF NEW.city IS NOT NULL THEN
        NEW.city := normalize_city_name(NEW.city);
    END IF;
    
    -- Normalize country
    IF NEW.country IS NOT NULL THEN
        NEW.country := CASE
            WHEN LOWER(NEW.country) LIKE '%deutschland%' OR LOWER(NEW.country) = 'de' THEN 'Germany'
            WHEN LOWER(NEW.country) LIKE '%españa%' OR LOWER(NEW.country) = 'es' THEN 'Spain'
            WHEN LOWER(NEW.country) LIKE '%österreich%' OR LOWER(NEW.country) = 'at' THEN 'Austria'
            WHEN LOWER(NEW.country) LIKE '%nederland%' OR LOWER(NEW.country) = 'nl' THEN 'Netherlands'
            WHEN LOWER(NEW.country) LIKE '%belgique%' OR LOWER(NEW.country) = 'be' THEN 'Belgium'
            WHEN LOWER(NEW.country) LIKE '%ireland%' OR LOWER(NEW.country) IN ('ie', 'irl') THEN 'Ireland'
            WHEN LOWER(NEW.country) LIKE '%united kingdom%' OR LOWER(NEW.country) IN ('uk', 'gb') THEN 'United Kingdom'
            WHEN LOWER(NEW.country) LIKE '%france%' OR LOWER(NEW.country) = 'fr' THEN 'France'
            WHEN LOWER(NEW.country) LIKE '%italia%' OR LOWER(NEW.country) = 'it' THEN 'Italy'
            WHEN LOWER(NEW.country) LIKE '%schweiz%' OR LOWER(NEW.country) = 'ch' THEN 'Switzerland'
            WHEN LOWER(NEW.country) LIKE '%sverige%' OR LOWER(NEW.country) = 'se' THEN 'Sweden'
            WHEN LOWER(NEW.country) LIKE '%danmark%' OR LOWER(NEW.country) = 'dk' THEN 'Denmark'
            WHEN LOWER(NEW.country) LIKE '%polska%' OR LOWER(NEW.country) = 'pl' THEN 'Poland'
            WHEN LOWER(NEW.country) LIKE '%czech%' OR LOWER(NEW.country) = 'cz' THEN 'Czech Republic'
            ELSE INITCAP(TRIM(NEW.country))
        END;
    END IF;
    
    -- Fix known country/city mismatches (prevent contamination)
    IF NEW.city = 'Berlin' AND NEW.country = 'United Kingdom' THEN
        NEW.country := 'Germany';
    END IF;
    IF NEW.city = 'Paris' AND NEW.country = 'United Kingdom' THEN
        NEW.country := 'France';
    END IF;
    IF NEW.city = 'Belfast' AND NEW.country = 'Ireland' THEN
        NEW.country := 'United Kingdom';
    END IF;
    
    -- Extract city from location if city is missing
    IF (NEW.city IS NULL OR NEW.city = '') AND NEW.location IS NOT NULL AND NEW.location != '' THEN
        NEW.city := TRIM(SPLIT_PART(NEW.location, ',', 1));
        -- Normalize the extracted city
        IF NEW.city IS NOT NULL AND NEW.city != '' THEN
            NEW.city := normalize_city_name(NEW.city);
        END IF;
    END IF;
    
    -- Clean company name
    IF NEW.company IS NOT NULL THEN
        NEW.company := clean_company_name(NEW.company);
    END IF;
    
    -- Clean company_name (sync from company if missing)
    IF NEW.company_name IS NULL AND NEW.company IS NOT NULL THEN
        NEW.company_name := clean_company_name(NEW.company);
    ELSIF NEW.company_name IS NOT NULL THEN
        NEW.company_name := clean_company_name(NEW.company_name);
    END IF;
    
    -- Trim whitespace from all text fields
    IF NEW.title IS NOT NULL THEN NEW.title := TRIM(NEW.title); END IF;
    IF NEW.location IS NOT NULL THEN NEW.location := TRIM(NEW.location); END IF;
    IF NEW.description IS NOT NULL THEN NEW.description := TRIM(NEW.description); END IF;
    
    -- ============================================================================
    -- METADATA EXTRACTION FROM DESCRIPTION
    -- ============================================================================
    
    IF NEW.description IS NOT NULL THEN
        desc_lower := LOWER(NEW.description);
        
        -- Extract visa sponsorship
        IF NEW.visa_sponsored IS NULL OR NEW.visa_sponsored = false THEN
            NEW.visa_sponsored := (
                desc_lower LIKE '%visa%sponsor%' OR
                desc_lower LIKE '%work permit%' OR
                desc_lower LIKE '%sponsor visa%' OR
                desc_lower LIKE '%visa support%' OR
                desc_lower LIKE '%visa sponsorship%' OR
                desc_lower LIKE '%will sponsor%' OR
                desc_lower LIKE '%sponsorship available%'
            );
        END IF;
        
        -- Extract remote work information
        IF desc_lower LIKE '%remote%' OR desc_lower LIKE '%work from home%' OR desc_lower LIKE '%wfh%' OR desc_lower LIKE '%work from anywhere%' THEN
            NEW.remote_possible := true;
            
            -- Determine work environment type
            IF NEW.work_environment IS NULL OR NEW.work_environment = 'on-site' THEN
                IF desc_lower LIKE '%hybrid%' OR desc_lower LIKE '%partially remote%' THEN
                    NEW.work_environment := 'hybrid';
                ELSIF desc_lower LIKE '%fully remote%' OR desc_lower LIKE '%100% remote%' OR desc_lower LIKE '%fully distributed%' THEN
                    NEW.work_environment := 'remote';
                ELSE
                    NEW.work_environment := 'flexible';
                END IF;
            END IF;
        END IF;
        
        -- Extract language requirements (simple pattern matching)
        IF NEW.language_requirements IS NULL OR array_length(NEW.language_requirements, 1) IS NULL THEN
            NEW.language_requirements := ARRAY[]::TEXT[];
            
            IF desc_lower LIKE '%english%' OR desc_lower LIKE '%fluent english%' OR desc_lower LIKE '%english required%' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'English');
            END IF;
            IF desc_lower LIKE '%german%' OR desc_lower LIKE '%deutsch%' OR desc_lower LIKE '%german required%' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'German');
            END IF;
            IF desc_lower LIKE '%french%' OR desc_lower LIKE '%français%' OR desc_lower LIKE '%french required%' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'French');
            END IF;
            IF desc_lower LIKE '%spanish%' OR desc_lower LIKE '%español%' OR desc_lower LIKE '%spanish required%' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Spanish');
            END IF;
            IF desc_lower LIKE '%italian%' OR desc_lower LIKE '%italiano%' OR desc_lower LIKE '%italian required%' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Italian');
            END IF;
            IF desc_lower LIKE '%dutch%' OR desc_lower LIKE '%nederlands%' OR desc_lower LIKE '%dutch required%' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Dutch');
            END IF;
            
            -- If no languages found, set to empty array
            IF array_length(NEW.language_requirements, 1) IS NULL THEN
                NEW.language_requirements := ARRAY[]::TEXT[];
            END IF;
        END IF;
        
        -- Note: Salary extraction is complex and requires regex
        -- For now, we'll leave it as-is (can be enhanced later)
        -- The salary_min and salary_max fields remain NULL if not explicitly set
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. BATCH BACKFILL METADATA FOR EXISTING JOBS
-- ============================================================================

-- Backfill visa sponsorship
UPDATE jobs
SET visa_sponsored = (
    LOWER(description) LIKE '%visa%sponsor%' OR
    LOWER(description) LIKE '%work permit%' OR
    LOWER(description) LIKE '%sponsor visa%' OR
    LOWER(description) LIKE '%visa support%' OR
    LOWER(description) LIKE '%visa sponsorship%' OR
    LOWER(description) LIKE '%will sponsor%' OR
    LOWER(description) LIKE '%sponsorship available%'
)
WHERE (visa_sponsored IS NULL OR visa_sponsored = false)
  AND description IS NOT NULL
  AND is_active = true;

-- Backfill remote work information
UPDATE jobs
SET remote_possible = true,
    work_environment = CASE
        WHEN LOWER(description) LIKE '%hybrid%' OR LOWER(description) LIKE '%partially remote%' THEN 'hybrid'
        WHEN LOWER(description) LIKE '%fully remote%' OR LOWER(description) LIKE '%100% remote%' OR LOWER(description) LIKE '%fully distributed%' THEN 'remote'
        WHEN LOWER(description) LIKE '%remote%' OR LOWER(description) LIKE '%work from home%' OR LOWER(description) LIKE '%wfh%' THEN 'flexible'
        ELSE work_environment
    END
WHERE (remote_possible IS NULL OR remote_possible = false)
  AND description IS NOT NULL
  AND is_active = true
  AND (
    LOWER(description) LIKE '%remote%' OR
    LOWER(description) LIKE '%work from home%' OR
    LOWER(description) LIKE '%wfh%' OR
    LOWER(description) LIKE '%work from anywhere%'
  );

-- Backfill language requirements
UPDATE jobs
SET language_requirements = (
    SELECT ARRAY_AGG(DISTINCT lang)
    FROM (
        SELECT 'English' as lang WHERE LOWER(description) LIKE '%english%' OR LOWER(description) LIKE '%fluent english%'
        UNION
        SELECT 'German' WHERE LOWER(description) LIKE '%german%' OR LOWER(description) LIKE '%deutsch%'
        UNION
        SELECT 'French' WHERE LOWER(description) LIKE '%french%' OR LOWER(description) LIKE '%français%'
        UNION
        SELECT 'Spanish' WHERE LOWER(description) LIKE '%spanish%' OR LOWER(description) LIKE '%español%'
        UNION
        SELECT 'Italian' WHERE LOWER(description) LIKE '%italian%' OR LOWER(description) LIKE '%italiano%'
        UNION
        SELECT 'Dutch' WHERE LOWER(description) LIKE '%dutch%' OR LOWER(description) LIKE '%nederlands%'
    ) languages
)
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) IS NULL)
  AND description IS NOT NULL
  AND is_active = true;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================
-- SELECT COUNT(*) as visa_sponsored FROM jobs WHERE visa_sponsored = true;
-- SELECT COUNT(*) as remote_jobs FROM jobs WHERE remote_possible = true;
-- SELECT work_environment, COUNT(*) FROM jobs WHERE remote_possible = true GROUP BY work_environment;
-- SELECT COUNT(*) as jobs_with_languages FROM jobs WHERE array_length(language_requirements, 1) > 0;

