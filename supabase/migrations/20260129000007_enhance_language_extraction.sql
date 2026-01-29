-- ============================================================================
-- ENHANCE LANGUAGE REQUIREMENTS EXTRACTION
-- Date: January 29, 2026
-- Purpose: Improve language extraction patterns to reach 50%+ coverage (from 35.07%)
--          Add more patterns and multilingual support
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENHANCED LANGUAGE EXTRACTION FOR EXISTING JOBS
-- ============================================================================

-- Update jobs with enhanced language extraction patterns
UPDATE jobs
SET language_requirements = (
    SELECT ARRAY_AGG(DISTINCT lang)
    FROM (
        -- English
        SELECT 'English' as lang 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(english|fluent\s+english|english\s+required|english\s+language|english\s+proficiency|english\s+speaking|english\s+written|native\s+english|english\s+native|business\s+english)\y'
        
        UNION
        
        -- German
        SELECT 'German' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(german|deutsch|fluent\s+german|german\s+required|german\s+language|german\s+proficiency|german\s+speaking|german\s+written|native\s+german|german\s+native|business\s+german|deutschkenntnisse|deutschsprachig)\y'
        
        UNION
        
        -- French
        SELECT 'French' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(french|français|francais|fluent\s+french|french\s+required|french\s+language|french\s+proficiency|french\s+speaking|french\s+written|native\s+french|french\s+native|business\s+french|francophone)\y'
        
        UNION
        
        -- Spanish
        SELECT 'Spanish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(spanish|español|espanol|fluent\s+spanish|spanish\s+required|spanish\s+language|spanish\s+proficiency|spanish\s+speaking|spanish\s+written|native\s+spanish|spanish\s+native|business\s+spanish|hispanohablante)\y'
        
        UNION
        
        -- Italian
        SELECT 'Italian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(italian|italiano|fluent\s+italian|italian\s+required|italian\s+language|italian\s+proficiency|italian\s+speaking|italian\s+written|native\s+italian|italian\s+native|business\s+italian)\y'
        
        UNION
        
        -- Dutch
        SELECT 'Dutch' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(dutch|nederlands|fluent\s+dutch|dutch\s+required|dutch\s+language|dutch\s+proficiency|dutch\s+speaking|dutch\s+written|native\s+dutch|dutch\s+native|business\s+dutch|nederlandstalig)\y'
        
        UNION
        
        -- Portuguese
        SELECT 'Portuguese' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(portuguese|português|portugues|fluent\s+portuguese|portuguese\s+required|portuguese\s+language|portuguese\s+proficiency|portuguese\s+speaking|portuguese\s+written|native\s+portuguese|portuguese\s+native|business\s+portuguese)\y'
        
        UNION
        
        -- Swedish
        SELECT 'Swedish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(swedish|svenska|fluent\s+swedish|swedish\s+required|swedish\s+language|swedish\s+proficiency|swedish\s+speaking|swedish\s+written|native\s+swedish|swedish\s+native)\y'
        
        UNION
        
        -- Danish
        SELECT 'Danish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(danish|dansk|fluent\s+danish|danish\s+required|danish\s+language|danish\s+proficiency|danish\s+speaking|danish\s+written|native\s+danish|danish\s+native)\y'
        
        UNION
        
        -- Norwegian
        SELECT 'Norwegian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(norwegian|norsk|fluent\s+norwegian|norwegian\s+required|norwegian\s+language|norwegian\s+proficiency|norwegian\s+speaking|norwegian\s+written|native\s+norwegian|norwegian\s+native)\y'
        
        UNION
        
        -- Polish
        SELECT 'Polish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(polish|polski|fluent\s+polish|polish\s+required|polish\s+language|polish\s+proficiency|polish\s+speaking|polish\s+written|native\s+polish|polish\s+native)\y'
        
        UNION
        
        -- Czech
        SELECT 'Czech' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(czech|čeština|cestina|fluent\s+czech|czech\s+required|czech\s+language|czech\s+proficiency|czech\s+speaking|czech\s+written|native\s+czech|czech\s+native)\y'
        
        UNION
        
        -- Additional patterns: "must speak X", "X is a must", "X proficiency"
        SELECT 'English' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(must\s+speak\s+english|english\s+is\s+a\s+must|english\s+proficiency|proficiency\s+in\s+english)\y'
        
        UNION
        
        SELECT 'German' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(must\s+speak\s+german|german\s+is\s+a\s+must|german\s+proficiency|proficiency\s+in\s+german|deutsch\s+erforderlich)\y'
        
        UNION
        
        SELECT 'French' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(must\s+speak\s+french|french\s+is\s+a\s+must|french\s+proficiency|proficiency\s+in\s+french|français\s+requis)\y'
        
        UNION
        
        SELECT 'Spanish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(must\s+speak\s+spanish|spanish\s+is\s+a\s+must|spanish\s+proficiency|proficiency\s+in\s+spanish|español\s+requerido)\y'
        
        UNION
        
        SELECT 'Italian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(must\s+speak\s+italian|italian\s+is\s+a\s+must|italian\s+proficiency|proficiency\s+in\s+italian|italiano\s+richiesto)\y'
        
        UNION
        
        SELECT 'Dutch' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(must\s+speak\s+dutch|dutch\s+is\s+a\s+must|dutch\s+proficiency|proficiency\s+in\s+dutch|nederlands\s+vereist)\y'
    ) languages
)
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) IS NULL)
  AND description IS NOT NULL
  AND description != ''
  AND is_active = true
  AND status = 'active';

-- ============================================================================
-- UPDATE TRIGGER FUNCTION WITH ENHANCED LANGUAGE EXTRACTION
-- ============================================================================

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
        
        -- Extract remote work information (ONLY set 'remote', 'hybrid', or 'office')
        IF desc_lower LIKE '%remote%' OR desc_lower LIKE '%work from home%' OR desc_lower LIKE '%wfh%' OR desc_lower LIKE '%work from anywhere%' THEN
            NEW.remote_possible := true;
            
            -- Determine work environment type (ONLY valid values: 'remote', 'hybrid', 'office')
            IF NEW.work_environment IS NULL OR NEW.work_environment NOT IN ('remote', 'hybrid', 'office') THEN
                IF desc_lower LIKE '%hybrid%' OR desc_lower LIKE '%partially remote%' THEN
                    NEW.work_environment := 'hybrid';
                ELSIF desc_lower LIKE '%fully remote%' OR desc_lower LIKE '%100% remote%' OR desc_lower LIKE '%fully distributed%' THEN
                    NEW.work_environment := 'remote';
                ELSE
                    -- Default remote jobs to 'remote' if unclear
                    NEW.work_environment := 'remote';
                END IF;
            END IF;
        ELSIF NEW.work_environment IS NULL OR NEW.work_environment NOT IN ('remote', 'hybrid', 'office') THEN
            -- If no remote indicators and work_environment is invalid/null, set to 'office'
            NEW.work_environment := 'office';
        END IF;
        
        -- Extract language requirements (ENHANCED patterns)
        IF NEW.language_requirements IS NULL OR array_length(NEW.language_requirements, 1) IS NULL THEN
            NEW.language_requirements := ARRAY[]::TEXT[];
            
            -- English (enhanced patterns)
            IF desc_lower ~ '\y(english|fluent\s+english|english\s+required|english\s+language|english\s+proficiency|english\s+speaking|english\s+written|native\s+english|english\s+native|business\s+english|must\s+speak\s+english|english\s+is\s+a\s+must|proficiency\s+in\s+english)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'English');
            END IF;
            
            -- German (enhanced patterns)
            IF desc_lower ~ '\y(german|deutsch|fluent\s+german|german\s+required|german\s+language|german\s+proficiency|german\s+speaking|german\s+written|native\s+german|german\s+native|business\s+german|deutschkenntnisse|deutschsprachig|must\s+speak\s+german|german\s+is\s+a\s+must|proficiency\s+in\s+german|deutsch\s+erforderlich)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'German');
            END IF;
            
            -- French (enhanced patterns)
            IF desc_lower ~ '\y(french|français|francais|fluent\s+french|french\s+required|french\s+language|french\s+proficiency|french\s+speaking|french\s+written|native\s+french|french\s+native|business\s+french|francophone|must\s+speak\s+french|french\s+is\s+a\s+must|proficiency\s+in\s+french|français\s+requis)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'French');
            END IF;
            
            -- Spanish (enhanced patterns)
            IF desc_lower ~ '\y(spanish|español|espanol|fluent\s+spanish|spanish\s+required|spanish\s+language|spanish\s+proficiency|spanish\s+speaking|spanish\s+written|native\s+spanish|spanish\s+native|business\s+spanish|hispanohablante|must\s+speak\s+spanish|spanish\s+is\s+a\s+must|proficiency\s+in\s+spanish|español\s+requerido)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Spanish');
            END IF;
            
            -- Italian (enhanced patterns)
            IF desc_lower ~ '\y(italian|italiano|fluent\s+italian|italian\s+required|italian\s+language|italian\s+proficiency|italian\s+speaking|italian\s+written|native\s+italian|italian\s+native|business\s+italian|must\s+speak\s+italian|italian\s+is\s+a\s+must|proficiency\s+in\s+italian|italiano\s+richiesto)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Italian');
            END IF;
            
            -- Dutch (enhanced patterns)
            IF desc_lower ~ '\y(dutch|nederlands|fluent\s+dutch|dutch\s+required|dutch\s+language|dutch\s+proficiency|dutch\s+speaking|dutch\s+written|native\s+dutch|dutch\s+native|business\s+dutch|nederlandstalig|must\s+speak\s+dutch|dutch\s+is\s+a\s+must|proficiency\s+in\s+dutch|nederlands\s+vereist)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Dutch');
            END IF;
            
            -- Portuguese (new)
            IF desc_lower ~ '\y(portuguese|português|portugues|fluent\s+portuguese|portuguese\s+required|portuguese\s+language|portuguese\s+proficiency|portuguese\s+speaking|portuguese\s+written|native\s+portuguese|portuguese\s+native|business\s+portuguese)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Portuguese');
            END IF;
            
            -- Swedish (new)
            IF desc_lower ~ '\y(swedish|svenska|fluent\s+swedish|swedish\s+required|swedish\s+language|swedish\s+proficiency|swedish\s+speaking|swedish\s+written|native\s+swedish|swedish\s+native)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Swedish');
            END IF;
            
            -- Danish (new)
            IF desc_lower ~ '\y(danish|dansk|fluent\s+danish|danish\s+required|danish\s+language|danish\s+proficiency|danish\s+speaking|danish\s+written|native\s+danish|danish\s+native)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Danish');
            END IF;
            
            -- Norwegian (new)
            IF desc_lower ~ '\y(norwegian|norsk|fluent\s+norwegian|norwegian\s+required|norwegian\s+language|norwegian\s+proficiency|norwegian\s+speaking|norwegian\s+written|native\s+norwegian|norwegian\s+native)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Norwegian');
            END IF;
            
            -- Polish (new)
            IF desc_lower ~ '\y(polish|polski|fluent\s+polish|polish\s+required|polish\s+language|polish\s+proficiency|polish\s+speaking|polish\s+written|native\s+polish|polish\s+native)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Polish');
            END IF;
            
            -- Czech (new)
            IF desc_lower ~ '\y(czech|čeština|cestina|fluent\s+czech|czech\s+required|czech\s+language|czech\s+proficiency|czech\s+speaking|czech\s+written|native\s+czech|czech\s+native)\y' THEN
                NEW.language_requirements := array_append(NEW.language_requirements, 'Czech');
            END IF;
            
            -- If no languages found, set to empty array
            IF array_length(NEW.language_requirements, 1) IS NULL THEN
                NEW.language_requirements := ARRAY[]::TEXT[];
            END IF;
        END IF;
    END IF;
    
    -- ============================================================================
    -- ENSURE work_environment IS ALWAYS SET (for ALL jobs, even without description)
    -- ============================================================================
    
    -- If work_environment is still NULL or invalid, default to 'office'
    IF NEW.work_environment IS NULL OR NEW.work_environment NOT IN ('remote', 'hybrid', 'office') THEN
        NEW.work_environment := 'office';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================
-- SELECT COUNT(*) as jobs_with_languages FROM jobs WHERE array_length(language_requirements, 1) > 0 AND is_active = true AND status = 'active';
-- SELECT ROUND(COUNT(CASE WHEN array_length(language_requirements, 1) > 0 THEN 1 END) * 100.0 / COUNT(*), 2) as language_coverage_pct FROM jobs WHERE is_active = true AND status = 'active';

