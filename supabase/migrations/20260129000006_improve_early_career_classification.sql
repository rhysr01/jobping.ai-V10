-- ============================================================================
-- IMPROVE EARLY CAREER CLASSIFICATION
-- Date: January 29, 2026
-- Purpose: Enhance classification patterns to reach 85%+ coverage (from 78.64%)
--          Add more patterns for ambiguous roles and edge cases
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENHANCED INTERNSHIP CLASSIFICATION
-- ============================================================================

-- Additional internship patterns (multilingual, variations)
UPDATE jobs
SET 
    is_internship = true,
    is_graduate = false,
    is_early_career = false
WHERE (is_internship IS NULL OR is_internship = false)
  AND (is_graduate IS NULL OR is_graduate = false)
  AND (is_early_career IS NULL OR is_early_career = false)
  AND (
    -- Additional English patterns
    LOWER(title) ~ '\y(student\s+intern|intern\s+student|summer\s+internship|winter\s+internship|co-op|coop|co-operative)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(student\s+intern|intern\s+student|summer\s+internship|winter\s+internship|co-op|coop|co-operative)\y'
    -- Additional multilingual patterns
    OR LOWER(title) ~ '\y(stage\s+étudiant|stages\s+étudiants|praktikum\s+student|studentenpraktikum|estágio|estagio|pasantía|pasantia)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(stage\s+étudiant|stages\s+étudiants|praktikum\s+student|studentenpraktikum|estágio|estagio|pasantía|pasantia)\y'
  )
  AND NOT (
    LOWER(title) ~ '\y(phd|doctorate)\s+(required|preferred|needed|candidate)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(phd|doctorate)\s+(required|preferred|needed|candidate)\y'
  )
  AND is_active = true
  AND status = 'active';

-- ============================================================================
-- 2. ENHANCED GRADUATE SCHEME CLASSIFICATION
-- ============================================================================

-- Additional graduate/trainee patterns
UPDATE jobs
SET 
    is_internship = false,
    is_graduate = true,
    is_early_career = false
WHERE (is_internship IS NULL OR is_internship = false)
  AND (is_graduate IS NULL OR is_graduate = false)
  AND (is_early_career IS NULL OR is_early_career = false)
  AND (
    -- Additional English patterns
    LOWER(title) ~ '\y(graduate\s+opportunity|graduate\s+position|graduate\s+role|entry\s+level\s+graduate|graduate\s+entry|first\s+job|starter\s+position|starter\s+role)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(graduate\s+opportunity|graduate\s+position|graduate\s+role|entry\s+level\s+graduate|graduate\s+entry|first\s+job|starter\s+position|starter\s+role)\y'
    -- Additional multilingual patterns
    OR LOWER(title) ~ '\y(berufseinsteiger|einsteiger|neueinsteiger|absolventenprogramm|absolventenstelle|primo\s+impiego|primo\s+lavoro|primer\s+empleo|primeiro\s+emprego)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(berufseinsteiger|einsteiger|neueinsteiger|absolventenprogramm|absolventenstelle|primo\s+impiego|primo\s+lavoro|primer\s+empleo|primeiro\s+emprego)\y'
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

-- ============================================================================
-- 3. ENHANCED EARLY CAREER CLASSIFICATION (More Ambiguous Roles)
-- ============================================================================

-- Classify more ambiguous roles as early career based on context
UPDATE jobs
SET 
    is_internship = false,
    is_graduate = false,
    is_early_career = true
WHERE (is_internship IS NULL OR is_internship = false)
  AND (is_graduate IS NULL OR is_graduate = false)
  AND (is_early_career IS NULL OR is_early_career = false)
  AND (
    -- Additional explicit early career patterns
    LOWER(title) ~ '\y(entry\s+position|entry\s+role|starting\s+position|starting\s+role|beginner|starter|first\s+role|first\s+position|career\s+starter)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(entry\s+position|entry\s+role|starting\s+position|starting\s+role|beginner|starter|first\s+role|first\s+position|career\s+starter)\y'
    -- Additional multilingual patterns
    OR LOWER(title) ~ '\y(débutant|débutante|principiante|principiante|iniciante|aanvanger|beginnend|nybörjare|nybegynder)\y'
    OR LOWER(COALESCE(description, '')) ~ '\y(débutant|débutante|principiante|principiante|iniciante|aanvanger|beginnend|nybörjare|nybegynder)\y'
    -- Context-based: Roles with "0-1 years" or "0-2 years" experience
    OR (
      LOWER(COALESCE(description, '')) ~ '\y(0\s*[-–]\s*[12]\s+years?\s+experience|0\s*[-–]\s*[12]\s+years?\s+of\s+experience|up\s+to\s+[12]\s+years?\s+experience)\y'
      AND NOT LOWER(title) ~ '\y(senior|principal|lead|head\s+of|director|manager|chief|vp|vice\s+president|executive|architect|staff\s+engineer|distinguished)\y'
    )
    -- Context-based: Roles mentioning "no experience required" or "training provided"
    OR (
      LOWER(COALESCE(description, '')) ~ '\y(no\s+experience\s+required|no\s+prior\s+experience|training\s+provided|training\s+will\s+be\s+provided|we\s+will\s+train|full\s+training|comprehensive\s+training)\y'
      AND NOT LOWER(title) ~ '\y(senior|principal|lead|head\s+of|director|manager|chief|vp|vice\s+president|executive|architect|staff\s+engineer|distinguished)\y'
    )
    -- Context-based: Roles mentioning "recent graduate" or "new graduate" in description
    OR (
      LOWER(COALESCE(description, '')) ~ '\y(recent\s+graduate|new\s+graduate|recently\s+graduated|just\s+graduated|fresh\s+graduate|newly\s+graduated)\y'
      AND NOT LOWER(title) ~ '\y(senior|principal|lead|head\s+of|director|manager|chief|vp|vice\s+president|executive|architect|staff\s+engineer|distinguished)\y'
    )
    -- Context-based: Roles mentioning "university" or "college" graduates
    OR (
      LOWER(COALESCE(description, '')) ~ '\y(university\s+graduate|college\s+graduate|degree\s+holder|bachelor\s+degree|master\s+degree)\s+(with\s+)?(no\s+experience|0\s+years?|entry\s+level)\y'
      AND NOT LOWER(title) ~ '\y(senior|principal|lead|head\s+of|director|manager|chief|vp|vice\s+president|executive|architect|staff\s+engineer|distinguished)\y'
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
-- 4. CLASSIFY BASED ON EXPERIENCE LEVEL FIELDS
-- ============================================================================

-- If min_yoe is 0 or 1, and max_yoe is <= 2, classify as early career
UPDATE jobs
SET 
    is_internship = false,
    is_graduate = false,
    is_early_career = true
WHERE (is_internship IS NULL OR is_internship = false)
  AND (is_graduate IS NULL OR is_graduate = false)
  AND (is_early_career IS NULL OR is_early_career = false)
  AND (
    (min_yoe IS NOT NULL AND min_yoe <= 1 AND (max_yoe IS NULL OR max_yoe <= 2))
    OR (min_yoe IS NULL AND max_yoe IS NOT NULL AND max_yoe <= 2)
  )
  AND NOT (
    LOWER(title) ~ '\y(senior|principal|lead|head\s+of|director|manager|chief|vp|vice\s+president|executive|architect|staff\s+engineer|distinguished)\y'
  )
  AND is_active = true
  AND status = 'active';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================
-- SELECT COUNT(*) as total_active FROM jobs WHERE is_active = true AND status = 'active';
-- SELECT COUNT(*) as classified_early_career FROM jobs WHERE (is_internship = true OR is_graduate = true OR is_early_career = true) AND is_active = true AND status = 'active';
-- SELECT ROUND(COUNT(CASE WHEN is_internship = true OR is_graduate = true OR is_early_career = true THEN 1 END) * 100.0 / COUNT(*), 2) as coverage_pct FROM jobs WHERE is_active = true AND status = 'active';

