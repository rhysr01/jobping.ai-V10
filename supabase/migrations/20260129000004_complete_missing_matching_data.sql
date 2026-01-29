-- ============================================================================
-- COMPLETE MISSING MATCHING DATA
-- Date: January 29, 2026
-- Purpose: Fill missing critical fields required for matching:
--          1. Country (extract from city/location)
--          2. Early career classification (is_internship, is_graduate, is_early_career)
--          3. Categories (basic inference for missing)
--          4. Mark jobs with missing/too-short descriptions as inactive
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTRACT COUNTRY FROM CITY/LOCATION
-- ============================================================================

-- Map known cities to countries
UPDATE jobs
SET country = CASE
    -- UK/Ireland cities
    WHEN city IN ('London', 'Manchester', 'Birmingham', 'Belfast') THEN 'United Kingdom'
    WHEN city = 'Dublin' THEN 'Ireland'
    -- German cities
    WHEN city IN ('Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart') THEN 'Germany'
    -- French cities
    WHEN city IN ('Paris', 'Lyon', 'Marseille', 'Toulouse') THEN 'France'
    -- Spanish cities
    WHEN city IN ('Madrid', 'Barcelona', 'Valencia', 'Seville') THEN 'Spain'
    -- Italian cities
    WHEN city IN ('Milan', 'Rome', 'Turin', 'Naples') THEN 'Italy'
    -- Netherlands cities
    WHEN city IN ('Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht') THEN 'Netherlands'
    -- Swiss cities
    WHEN city IN ('Zurich', 'Geneva', 'Basel', 'Bern') THEN 'Switzerland'
    -- Austrian cities
    WHEN city IN ('Vienna', 'Graz', 'Linz', 'Salzburg') THEN 'Austria'
    -- Belgian cities
    WHEN city IN ('Brussels', 'Antwerp', 'Ghent', 'Bruges') THEN 'Belgium'
    -- Swedish cities
    WHEN city IN ('Stockholm', 'Gothenburg', 'Malmö') THEN 'Sweden'
    -- Danish cities
    WHEN city IN ('Copenhagen', 'Aarhus', 'Odense') THEN 'Denmark'
    -- Polish cities
    WHEN city IN ('Warsaw', 'Krakow', 'Wroclaw', 'Gdansk') THEN 'Poland'
    -- Czech cities
    WHEN city IN ('Prague', 'Brno', 'Ostrava') THEN 'Czech Republic'
    ELSE country
END
WHERE (country IS NULL OR country = '')
  AND city IS NOT NULL
  AND city != ''
  AND is_active = true
  AND status = 'active';

-- Extract country from location field if still missing
UPDATE jobs
SET country = CASE
    WHEN LOWER(location) LIKE '%united kingdom%' OR LOWER(location) LIKE '%uk%' OR LOWER(location) LIKE '%england%' OR LOWER(location) LIKE '%scotland%' OR LOWER(location) LIKE '%wales%' THEN 'United Kingdom'
    WHEN LOWER(location) LIKE '%ireland%' OR LOWER(location) LIKE '%dublin%' THEN 'Ireland'
    WHEN LOWER(location) LIKE '%germany%' OR LOWER(location) LIKE '%deutschland%' OR LOWER(location) LIKE '%berlin%' OR LOWER(location) LIKE '%munich%' THEN 'Germany'
    WHEN LOWER(location) LIKE '%france%' OR LOWER(location) LIKE '%paris%' THEN 'France'
    WHEN LOWER(location) LIKE '%spain%' OR LOWER(location) LIKE '%españa%' OR LOWER(location) LIKE '%madrid%' OR LOWER(location) LIKE '%barcelona%' THEN 'Spain'
    WHEN LOWER(location) LIKE '%italy%' OR LOWER(location) LIKE '%italia%' OR LOWER(location) LIKE '%milan%' OR LOWER(location) LIKE '%rome%' THEN 'Italy'
    WHEN LOWER(location) LIKE '%netherlands%' OR LOWER(location) LIKE '%holland%' OR LOWER(location) LIKE '%amsterdam%' THEN 'Netherlands'
    WHEN LOWER(location) LIKE '%switzerland%' OR LOWER(location) LIKE '%schweiz%' OR LOWER(location) LIKE '%zurich%' THEN 'Switzerland'
    WHEN LOWER(location) LIKE '%austria%' OR LOWER(location) LIKE '%österreich%' OR LOWER(location) LIKE '%vienna%' THEN 'Austria'
    WHEN LOWER(location) LIKE '%belgium%' OR LOWER(location) LIKE '%belgië%' OR LOWER(location) LIKE '%brussels%' THEN 'Belgium'
    WHEN LOWER(location) LIKE '%sweden%' OR LOWER(location) LIKE '%sverige%' OR LOWER(location) LIKE '%stockholm%' THEN 'Sweden'
    WHEN LOWER(location) LIKE '%denmark%' OR LOWER(location) LIKE '%danmark%' OR LOWER(location) LIKE '%copenhagen%' THEN 'Denmark'
    WHEN LOWER(location) LIKE '%poland%' OR LOWER(location) LIKE '%polska%' OR LOWER(location) LIKE '%warsaw%' THEN 'Poland'
    WHEN LOWER(location) LIKE '%czech%' OR LOWER(location) LIKE '%prague%' THEN 'Czech Republic'
    ELSE country
END
WHERE (country IS NULL OR country = '')
  AND location IS NOT NULL
  AND location != ''
  AND is_active = true
  AND status = 'active';

-- ============================================================================
-- 2. CLASSIFY EARLY CAREER JOBS (is_internship, is_graduate, is_early_career)
-- ============================================================================

-- Classify internships (highest priority)
UPDATE jobs
SET 
    is_internship = true,
    is_graduate = false,
    is_early_career = false
WHERE (is_internship IS NULL OR is_internship = false)
  AND (is_graduate IS NULL OR is_graduate = false)
  AND (is_early_career IS NULL OR is_early_career = false)
  AND (
    LOWER(title) ~ '\y(intern|internship|placement|spring\s+intern|summer\s+intern|work\s+experience|industrial\s+placement|sandwich\s+placement|praktikum|praktikant|stage|stagiaire|tirocinio|stagista)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(intern|internship|placement|spring\s+intern|summer\s+intern|work\s+experience|industrial\s+placement|sandwich\s+placement|praktikum|praktikant|stage|stagiaire|tirocinio|stagista)\y'
  )
  AND NOT (
    LOWER(title) ~ '\y(phd|doctorate)\s+(required|preferred|needed|candidate)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(phd|doctorate)\s+(required|preferred|needed|candidate)\y'
  )
  AND is_active = true
  AND status = 'active';

-- Classify graduate schemes (second priority)
UPDATE jobs
SET 
    is_internship = false,
    is_graduate = true,
    is_early_career = false
WHERE (is_internship IS NULL OR is_internship = false)
  AND (is_graduate IS NULL OR is_graduate = false)
  AND (is_early_career IS NULL OR is_early_career = false)
  AND (
    LOWER(title) ~ '\y(graduate\s+(scheme|program|programme|trainee|development|role)|management\s+trainee|trainee\s+programme|trainee\s+program|rotational\s+program|apprentice|apprenticeship|new\s+grad|recent\s+graduate|berufseinstieg|ausbildung|alternance|formaci[óo]n\s+dual|apprendistato|neolaureato|leerwerkplek|starterfunctie|nyuddannet|fresher)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(graduate\s+(scheme|program|programme|trainee|development|role)|management\s+trainee|trainee\s+programme|trainee\s+program|rotational\s+program|apprentice|apprenticeship|new\s+grad|recent\s+graduate|berufseinstieg|ausbildung|alternance|formaci[óo]n\s+dual|apprendistato|neolaureato|leerwerkplek|starterfunctie|nyuddannet|fresher)\y'
  )
  AND NOT (
    LOWER(title) ~ '\y(phd|doctorate)\s+(required|preferred|needed|candidate)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(phd|doctorate)\s+(required|preferred|needed|candidate)\y'
  )
  AND NOT (
    LOWER(title) ~ '\y(senior|principal|lead|head\s+of|director|manager|chief|vp|vice\s+president|executive|architect|staff\s+engineer|distinguished)\y'
  )
  AND is_active = true
  AND status = 'active';

-- Classify early career (junior/entry-level) - exclude senior titles
UPDATE jobs
SET 
    is_internship = false,
    is_graduate = false,
    is_early_career = true
WHERE (is_internship IS NULL OR is_internship = false)
  AND (is_graduate IS NULL OR is_graduate = false)
  AND (is_early_career IS NULL OR is_early_career = false)
  AND (
    LOWER(title) ~ '\y(junior|entry\s+level|entry-level|new\s+grad|recent\s+graduate|campus\s+hire|rotational\s+program|fellowship|d[ée]butant|absolvent|reci[eé]n\s+titulado|joven\s+profesional|nivel\s+inicial|puesto\s+de\s+entrada)\y'
    OR (
      LOWER(title) ~ '\y(analyst|assistant|associate|coordinator)\y'
      AND (
        LOWER(COALESCE(description, '')) ~ '\y(graduate|entry\s+level|no\s+experience|0-2\s+years|training\s+provided|learn\s+on\s+the\s+job|perfect\s+for\s+graduates)\y'
        OR NOT LOWER(COALESCE(description, '')) ~ '\y([5-9]|1[0-9]|2[0-9]|3[0-9])\s+years?\s+(of\s+)?experience\y'
      )
    )
  )
  AND NOT (
    LOWER(title) ~ '\y(senior|principal|lead|head\s+of|director|manager|chief|vp|vice\s+president|executive|architect|staff\s+engineer|distinguished)\y'
  )
  AND NOT (
    LOWER(COALESCE(description, '')) ~ '\y(not\s+(?:suitable\s+)?for|not\s+an?|no\s+entry.?level|will\s+not\s+(?:consider|accept)|cannot\s+(?:hire|accept))\s+(?:\w+\s+)?(beginners|graduates?|entry|junior|inexperienced|candidates?)\y'
  )
  AND is_active = true
  AND status = 'active';

-- ============================================================================
-- 3. ADD BASIC CATEGORIES FOR JOBS MISSING THEM
-- ============================================================================

-- Add 'early-career' category if job is classified as early career but missing categories
UPDATE jobs
SET categories = CASE
    WHEN categories IS NULL OR array_length(categories, 1) IS NULL THEN ARRAY['early-career']
    WHEN NOT ('early-career' = ANY(categories)) THEN array_append(categories, 'early-career')
    ELSE categories
END
WHERE (categories IS NULL OR array_length(categories, 1) IS NULL)
  AND (is_internship = true OR is_graduate = true OR is_early_career = true)
  AND is_active = true
  AND status = 'active';

-- Add 'internship' category if job is classified as internship
UPDATE jobs
SET categories = CASE
    WHEN categories IS NULL OR array_length(categories, 1) IS NULL THEN ARRAY['internship', 'early-career']
    WHEN NOT ('internship' = ANY(categories)) THEN array_append(categories, 'internship')
    ELSE categories
END
WHERE is_internship = true
  AND (categories IS NULL OR NOT ('internship' = ANY(categories)))
  AND is_active = true
  AND status = 'active';

-- Add 'graduate' category if job is classified as graduate
UPDATE jobs
SET categories = CASE
    WHEN categories IS NULL OR array_length(categories, 1) IS NULL THEN ARRAY['graduate', 'early-career']
    WHEN NOT ('graduate' = ANY(categories)) THEN array_append(categories, 'graduate')
    ELSE categories
END
WHERE is_graduate = true
  AND (categories IS NULL OR NOT ('graduate' = ANY(categories)))
  AND is_active = true
  AND status = 'active';

-- For jobs still missing categories, add 'general' as fallback
UPDATE jobs
SET categories = ARRAY['general', 'early-career']
WHERE (categories IS NULL OR array_length(categories, 1) IS NULL)
  AND is_active = true
  AND status = 'active';

-- ============================================================================
-- 4. MARK JOBS WITH MISSING/TOO-SHORT DESCRIPTIONS AS INACTIVE
-- ============================================================================

-- Mark jobs with missing or too-short descriptions as inactive
-- Minimum 50 characters required for matching
UPDATE jobs
SET 
    is_active = false,
    status = 'inactive',
    filtered_reason = 'Missing or insufficient description (minimum 50 characters required)'
WHERE (description IS NULL 
   OR description = '' 
   OR LENGTH(description) < 50)
  AND is_active = true
  AND status = 'active';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================
-- SELECT COUNT(*) as missing_country FROM jobs WHERE (country IS NULL OR country = '') AND is_active = true AND status = 'active';
-- SELECT COUNT(*) as missing_categories FROM jobs WHERE (categories IS NULL OR array_length(categories, 1) IS NULL) AND is_active = true AND status = 'active';
-- SELECT COUNT(*) as not_classified FROM jobs WHERE (is_internship IS NULL OR is_internship = false) AND (is_graduate IS NULL OR is_graduate = false) AND (is_early_career IS NULL OR is_early_career = false) AND is_active = true AND status = 'active';
-- SELECT COUNT(*) as missing_description FROM jobs WHERE (description IS NULL OR description = '' OR LENGTH(description) < 50) AND is_active = true AND status = 'active';

