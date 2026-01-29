-- ============================================================================
-- COMPREHENSIVE LANGUAGE REQUIREMENTS EXTRACTION
-- Date: January 29, 2026
-- Purpose: Extract ALL languages from signup form (40+ languages)
--          Match all languages available in premium signup form
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENHANCED LANGUAGE EXTRACTION FOR EXISTING JOBS
-- ============================================================================

UPDATE jobs
SET language_requirements = (
    SELECT ARRAY_AGG(DISTINCT lang)
    FROM (
        -- Core EU Languages
        SELECT 'English' as lang 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(english|fluent\s+english|english\s+required|english\s+language|english\s+proficiency|english\s+speaking|english\s+written|native\s+english|english\s+native|business\s+english|must\s+speak\s+english|english\s+is\s+a\s+must|proficiency\s+in\s+english)\y'
        
        UNION SELECT 'French' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(french|français|francais|fluent\s+french|french\s+required|french\s+language|french\s+proficiency|french\s+speaking|french\s+written|native\s+french|french\s+native|business\s+french|francophone|must\s+speak\s+french|french\s+is\s+a\s+must|proficiency\s+in\s+french|français\s+requis)\y'
        
        UNION SELECT 'German' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(german|deutsch|fluent\s+german|german\s+required|german\s+language|german\s+proficiency|german\s+speaking|german\s+written|native\s+german|german\s+native|business\s+german|deutschkenntnisse|deutschsprachig|must\s+speak\s+german|german\s+is\s+a\s+must|proficiency\s+in\s+german|deutsch\s+erforderlich)\y'
        
        UNION SELECT 'Spanish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(spanish|español|espanol|fluent\s+spanish|spanish\s+required|spanish\s+language|spanish\s+proficiency|spanish\s+speaking|spanish\s+written|native\s+spanish|spanish\s+native|business\s+spanish|hispanohablante|must\s+speak\s+spanish|spanish\s+is\s+a\s+must|proficiency\s+in\s+spanish|español\s+requerido)\y'
        
        UNION SELECT 'Italian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(italian|italiano|fluent\s+italian|italian\s+required|italian\s+language|italian\s+proficiency|italian\s+speaking|italian\s+written|native\s+italian|italian\s+native|business\s+italian|must\s+speak\s+italian|italian\s+is\s+a\s+must|proficiency\s+in\s+italian|italiano\s+richiesto)\y'
        
        UNION SELECT 'Dutch' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(dutch|nederlands|fluent\s+dutch|dutch\s+required|dutch\s+language|dutch\s+proficiency|dutch\s+speaking|dutch\s+written|native\s+dutch|dutch\s+native|business\s+dutch|nederlandstalig|must\s+speak\s+dutch|dutch\s+is\s+a\s+must|proficiency\s+in\s+dutch|nederlands\s+vereist)\y'
        
        UNION SELECT 'Portuguese' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(portuguese|português|portugues|fluent\s+portuguese|portuguese\s+required|portuguese\s+language|portuguese\s+proficiency|portuguese\s+speaking|portuguese\s+written|native\s+portuguese|portuguese\s+native|business\s+portuguese)\y'
        
        -- Additional EU Languages
        UNION SELECT 'Polish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(polish|polski|fluent\s+polish|polish\s+required|polish\s+language|polish\s+proficiency|polish\s+speaking|polish\s+written|native\s+polish|polish\s+native)\y'
        
        UNION SELECT 'Swedish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(swedish|svenska|fluent\s+swedish|swedish\s+required|swedish\s+language|swedish\s+proficiency|swedish\s+speaking|swedish\s+written|native\s+swedish|swedish\s+native)\y'
        
        UNION SELECT 'Danish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(danish|dansk|fluent\s+danish|danish\s+required|danish\s+language|danish\s+proficiency|danish\s+speaking|danish\s+written|native\s+danish|danish\s+native)\y'
        
        UNION SELECT 'Finnish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(finnish|suomi|fluent\s+finnish|finnish\s+required|finnish\s+language|finnish\s+proficiency|finnish\s+speaking|finnish\s+written|native\s+finnish|finnish\s+native)\y'
        
        UNION SELECT 'Czech' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(czech|čeština|cestina|fluent\s+czech|czech\s+required|czech\s+language|czech\s+proficiency|czech\s+speaking|czech\s+written|native\s+czech|czech\s+native)\y'
        
        UNION SELECT 'Romanian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(romanian|română|romana|fluent\s+romanian|romanian\s+required|romanian\s+language|romanian\s+proficiency|romanian\s+speaking|romanian\s+written|native\s+romanian|romanian\s+native)\y'
        
        UNION SELECT 'Hungarian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(hungarian|magyar|fluent\s+hungarian|hungarian\s+required|hungarian\s+language|hungarian\s+proficiency|hungarian\s+speaking|hungarian\s+written|native\s+hungarian|hungarian\s+native)\y'
        
        UNION SELECT 'Greek' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(greek|ελληνικά|ellinika|fluent\s+greek|greek\s+required|greek\s+language|greek\s+proficiency|greek\s+speaking|greek\s+written|native\s+greek|greek\s+native)\y'
        
        UNION SELECT 'Bulgarian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(bulgarian|български|bulgarski|fluent\s+bulgarian|bulgarian\s+required|bulgarian\s+language|bulgarian\s+proficiency|bulgarian\s+speaking|bulgarian\s+written|native\s+bulgarian|bulgarian\s+native)\y'
        
        UNION SELECT 'Croatian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(croatian|hrvatski|fluent\s+croatian|croatian\s+required|croatian\s+language|croatian\s+proficiency|croatian\s+speaking|croatian\s+written|native\s+croatian|croatian\s+native)\y'
        
        UNION SELECT 'Serbian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(serbian|srpski|fluent\s+serbian|serbian\s+required|serbian\s+language|serbian\s+proficiency|serbian\s+speaking|serbian\s+written|native\s+serbian|serbian\s+native)\y'
        
        UNION SELECT 'Slovak' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(slovak|slovenčina|slovencina|fluent\s+slovak|slovak\s+required|slovak\s+language|slovak\s+proficiency|slovak\s+speaking|slovak\s+written|native\s+slovak|slovak\s+native)\y'
        
        UNION SELECT 'Slovenian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(slovenian|slovenski|fluent\s+slovenian|slovenian\s+required|slovenian\s+language|slovenian\s+proficiency|slovenian\s+speaking|slovenian\s+written|native\s+slovenian|slovenian\s+native)\y'
        
        UNION SELECT 'Estonian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(estonian|eesti|fluent\s+estonian|estonian\s+required|estonian\s+language|estonian\s+proficiency|estonian\s+speaking|estonian\s+written|native\s+estonian|estonian\s+native)\y'
        
        UNION SELECT 'Latvian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(latvian|latviešu|latviesu|fluent\s+latvian|latvian\s+required|latvian\s+language|latvian\s+proficiency|latvian\s+speaking|latvian\s+written|native\s+latvian|latvian\s+native)\y'
        
        UNION SELECT 'Lithuanian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(lithuanian|lietuvių|lietuviau|fluent\s+lithuanian|lithuanian\s+required|lithuanian\s+language|lithuanian\s+proficiency|lithuanian\s+speaking|lithuanian\s+written|native\s+lithuanian|lithuanian\s+native)\y'
        
        UNION SELECT 'Ukrainian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(ukrainian|українська|ukrainska|fluent\s+ukrainian|ukrainian\s+required|ukrainian\s+language|ukrainian\s+proficiency|ukrainian\s+speaking|ukrainian\s+written|native\s+ukrainian|ukrainian\s+native)\y'
        
        -- Middle Eastern & Central Asian
        UNION SELECT 'Arabic' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(arabic|العربية|fluent\s+arabic|arabic\s+required|arabic\s+language|arabic\s+proficiency|arabic\s+speaking|arabic\s+written|native\s+arabic|arabic\s+native)\y'
        
        UNION SELECT 'Turkish' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(turkish|türkçe|turkce|fluent\s+turkish|turkish\s+required|turkish\s+language|turkish\s+proficiency|turkish\s+speaking|turkish\s+written|native\s+turkish|turkish\s+native)\y'
        
        UNION SELECT 'Hebrew' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(hebrew|עברית|fluent\s+hebrew|hebrew\s+required|hebrew\s+language|hebrew\s+proficiency|hebrew\s+speaking|hebrew\s+written|native\s+hebrew|hebrew\s+native)\y'
        
        UNION SELECT 'Persian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(persian|فارسی|farsi|fluent\s+persian|persian\s+required|persian\s+language|persian\s+proficiency|persian\s+speaking|persian\s+written|native\s+persian|persian\s+native)\y'
        
        UNION SELECT 'Farsi' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(farsi|فارسی|fluent\s+farsi|farsi\s+required|farsi\s+language|farsi\s+proficiency|farsi\s+speaking|farsi\s+written|native\s+farsi|farsi\s+native)\y'
        
        UNION SELECT 'Urdu' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(urdu|اردو|fluent\s+urdu|urdu\s+required|urdu\s+language|urdu\s+proficiency|urdu\s+speaking|urdu\s+written|native\s+urdu|urdu\s+native)\y'
        
        -- Asian Languages
        UNION SELECT 'Japanese' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(japanese|日本語|nihongo|fluent\s+japanese|japanese\s+required|japanese\s+language|japanese\s+proficiency|japanese\s+speaking|japanese\s+written|native\s+japanese|japanese\s+native)\y'
        
        UNION SELECT 'Chinese' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(chinese|中文|zhongwen|fluent\s+chinese|chinese\s+required|chinese\s+language|chinese\s+proficiency|chinese\s+speaking|chinese\s+written|native\s+chinese|chinese\s+native)\y'
        
        UNION SELECT 'Mandarin' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(mandarin|普通话|putonghua|fluent\s+mandarin|mandarin\s+required|mandarin\s+language|mandarin\s+proficiency|mandarin\s+speaking|mandarin\s+written|native\s+mandarin|mandarin\s+native)\y'
        
        UNION SELECT 'Cantonese' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(cantonese|廣東話|guangdonghua|fluent\s+cantonese|cantonese\s+required|cantonese\s+language|cantonese\s+proficiency|cantonese\s+speaking|cantonese\s+written|native\s+cantonese|cantonese\s+native)\y'
        
        UNION SELECT 'Korean' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(korean|한국어|hangugeo|fluent\s+korean|korean\s+required|korean\s+language|korean\s+proficiency|korean\s+speaking|korean\s+written|native\s+korean|korean\s+native)\y'
        
        UNION SELECT 'Hindi' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(hindi|हिन्दी|fluent\s+hindi|hindi\s+required|hindi\s+language|hindi\s+proficiency|hindi\s+speaking|hindi\s+written|native\s+hindi|hindi\s+native)\y'
        
        UNION SELECT 'Thai' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(thai|ไทย|fluent\s+thai|thai\s+required|thai\s+language|thai\s+proficiency|thai\s+speaking|thai\s+written|native\s+thai|thai\s+native)\y'
        
        UNION SELECT 'Vietnamese' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(vietnamese|tiếng\s+việt|tieng\s+viet|fluent\s+vietnamese|vietnamese\s+required|vietnamese\s+language|vietnamese\s+proficiency|vietnamese\s+speaking|vietnamese\s+written|native\s+vietnamese|vietnamese\s+native)\y'
        
        UNION SELECT 'Indonesian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(indonesian|bahasa\s+indonesia|fluent\s+indonesian|indonesian\s+required|indonesian\s+language|indonesian\s+proficiency|indonesian\s+speaking|indonesian\s+written|native\s+indonesian|indonesian\s+native)\y'
        
        UNION SELECT 'Tagalog' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(tagalog|filipino|fluent\s+tagalog|tagalog\s+required|tagalog\s+language|tagalog\s+proficiency|tagalog\s+speaking|tagalog\s+written|native\s+tagalog|tagalog\s+native)\y'
        
        UNION SELECT 'Malay' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(malay|bahasa\s+melayu|fluent\s+malay|malay\s+required|malay\s+language|malay\s+proficiency|malay\s+speaking|malay\s+written|native\s+malay|malay\s+native)\y'
        
        UNION SELECT 'Bengali' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(bengali|বাংলা|bangla|fluent\s+bengali|bengali\s+required|bengali\s+language|bengali\s+proficiency|bengali\s+speaking|bengali\s+written|native\s+bengali|bengali\s+native)\y'
        
        UNION SELECT 'Tamil' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(tamil|தமிழ்|fluent\s+tamil|tamil\s+required|tamil\s+language|tamil\s+proficiency|tamil\s+speaking|tamil\s+written|native\s+tamil|tamil\s+native)\y'
        
        UNION SELECT 'Telugu' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(telugu|తెలుగు|fluent\s+telugu|telugu\s+required|telugu\s+language|telugu\s+proficiency|telugu\s+speaking|telugu\s+written|native\s+telugu|telugu\s+native)\y'
        
        -- Other Common Languages
        UNION SELECT 'Russian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(russian|русский|russkiy|fluent\s+russian|russian\s+required|russian\s+language|russian\s+proficiency|russian\s+speaking|russian\s+written|native\s+russian|russian\s+native)\y'
        
        UNION SELECT 'Norwegian' 
        WHERE LOWER(COALESCE(description, '')) ~ '\y(norwegian|norsk|fluent\s+norwegian|norwegian\s+required|norwegian\s+language|norwegian\s+proficiency|norwegian\s+speaking|norwegian\s+written|native\s+norwegian|norwegian\s+native)\y'
    ) languages
)
WHERE (language_requirements IS NULL OR array_length(language_requirements, 1) IS NULL)
  AND description IS NOT NULL
  AND description != ''
  AND is_active = true
  AND status = 'active';

COMMIT;

