-- Industry Extraction Migration
-- Extracts industries from company names and descriptions for all jobs
-- Uses pattern matching similar to industryExtraction.cjs logic

-- Technology
UPDATE jobs
SET industries = industries || ARRAY['Technology']
WHERE NOT (industries @> ARRAY['Technology'])
  AND (
    LOWER(company) ~* '\b(tech|software|it|saas|platform|digital|cloud|ai|ml|data.*tech|tech.*company|tech.*firm|startup|scaleup|fintech|edtech|healthtech|proptech|insurtech)\b'
    OR LOWER(company) ~* '\b(amazon|google|microsoft|apple|meta|facebook|netflix|spotify|uber|airbnb|salesforce|oracle|ibm|sap|adobe)\b'
    OR LOWER(description) ~* '\b(software.*development|programming|coding|developer|engineer|devops|cloud.*computing|api|backend|frontend|full.*stack|machine.*learning|artificial.*intelligence)\b'
  );

-- Finance
UPDATE jobs
SET industries = industries || ARRAY['Finance']
WHERE NOT (industries @> ARRAY['Finance'])
  AND (
    LOWER(company) ~* '\b(bank|finance|financial|investment|invest|capital|wealth|asset|trading|trader|broker|fund|hedge|accounting|audit|tax|accountant|cpa|cfa|actuary|actuarial)\b'
    OR LOWER(company) ~* '\b(goldman|morgan|jpmorgan|barclays|hsbc|deutsche.*bank|ubs|credit.*suisse|bnp|societe.*generale)\b'
    OR LOWER(description) ~* '\b(financial.*analysis|investment.*banking|risk.*management|portfolio.*management|accounting|audit|tax.*advisory|corporate.*finance|m&a|mergers.*acquisitions)\b'
  );

-- Consulting
UPDATE jobs
SET industries = industries || ARRAY['Consulting']
WHERE NOT (industries @> ARRAY['Consulting'])
  AND (
    LOWER(company) ~* '\b(consulting|consultant|advisory|adviser|mckinsey|bain|bcg|deloitte|pwc|ey|kpmg|accenture|capgemini|strategy.*consulting|management.*consulting|business.*consulting)\b'
    OR LOWER(description) ~* '\b(management.*consulting|strategy.*consulting|business.*transformation|advisory.*services|client.*engagement|project.*management|change.*management)\b'
  );

-- Healthcare
UPDATE jobs
SET industries = industries || ARRAY['Healthcare']
WHERE NOT (industries @> ARRAY['Healthcare'])
  AND (
    LOWER(company) ~* '\b(health|medical|hospital|clinic|pharma|pharmaceutical|biotech|biomedical|nurse|doctor|physician|healthcare|health.*care|medtech|healthtech)\b'
    OR LOWER(description) ~* '\b(patient.*care|clinical|medical.*device|pharmaceutical|healthcare.*administration|health.*services|medical.*research|biomedical.*research)\b'
  );

-- Retail
UPDATE jobs
SET industries = industries || ARRAY['Retail']
WHERE NOT (industries @> ARRAY['Retail'])
  AND (
    LOWER(company) ~* '\b(retail|store|shop|supermarket|grocery|ecommerce|e-commerce|marketplace|fashion.*retail|consumer.*goods|fcmg)\b'
    OR LOWER(description) ~* '\b(retail.*operations|store.*management|merchandising|ecommerce|online.*retail|customer.*service|sales.*associate|retail.*sales)\b'
  );

-- Manufacturing
UPDATE jobs
SET industries = industries || ARRAY['Manufacturing']
WHERE NOT (industries @> ARRAY['Manufacturing'])
  AND (
    LOWER(company) ~* '\b(manufacturing|factory|production|industrial|engineering|automation|supply.*chain|manufacturer|producer|assembly|fabrication)\b'
    OR LOWER(description) ~* '\b(production.*management|quality.*control|manufacturing.*process|industrial.*engineering|supply.*chain|procurement|operations.*management)\b'
  );

-- Energy
UPDATE jobs
SET industries = industries || ARRAY['Energy']
WHERE NOT (industries @> ARRAY['Energy'])
  AND (
    LOWER(company) ~* '\b(energy|power|oil|gas|petroleum|renewable|solar|wind|nuclear|utilities|utility|energy.*company|power.*company|oil.*company|gas.*company)\b'
    OR LOWER(description) ~* '\b(energy.*management|renewable.*energy|solar.*power|wind.*energy|power.*generation|utilities|energy.*trading|oil.*gas)\b'
  );

-- Media
UPDATE jobs
SET industries = industries || ARRAY['Media']
WHERE NOT (industries @> ARRAY['Media'])
  AND (
    LOWER(company) ~* '\b(media|publishing|journalism|journalist|news|broadcast|tv|television|radio|magazine|newspaper|entertainment|content|streaming)\b'
    OR LOWER(description) ~* '\b(content.*creation|journalism|media.*production|broadcasting|digital.*media|editorial|publishing|media.*relations|pr|public.*relations)\b'
  );

-- Education
UPDATE jobs
SET industries = industries || ARRAY['Education']
WHERE NOT (industries @> ARRAY['Education'])
  AND (
    LOWER(company) ~* '\b(education|university|school|college|academic|teaching|teacher|professor|tutor|learning|edtech|educational|academy|institute|training)\b'
    OR LOWER(description) ~* '\b(teaching|curriculum|educational.*technology|student.*services|academic.*support|learning.*development|training.*programs|educational.*administration)\b'
  );

-- Government
UPDATE jobs
SET industries = industries || ARRAY['Government']
WHERE NOT (industries @> ARRAY['Government'])
  AND (
    LOWER(company) ~* '\b(government|public.*sector|ministry|department|agency|authority|municipal|city.*council|public.*service|civil.*service|european.*union|eu)\b'
    OR LOWER(description) ~* '\b(public.*policy|government.*services|civil.*service|public.*administration|regulatory|compliance|public.*sector)\b'
  );

-- Non-profit
UPDATE jobs
SET industries = industries || ARRAY['Non-profit']
WHERE NOT (industries @> ARRAY['Non-profit'])
  AND (
    LOWER(company) ~* '\b(nonprofit|non-profit|ngo|charity|foundation|volunteer|social.*impact|philanthropy|not.*for.*profit|npo|charitable)\b'
    OR LOWER(description) ~* '\b(social.*impact|charity|fundraising|nonprofit|ngo|volunteer.*management|community.*development|social.*services|philanthropy)\b'
  );

-- Real Estate
UPDATE jobs
SET industries = industries || ARRAY['Real Estate']
WHERE NOT (industries @> ARRAY['Real Estate'])
  AND (
    LOWER(company) ~* '\b(real.*estate|property|realtor|estate.*agent|property.*management|construction|building|proptech|property.*development|realty)\b'
    OR LOWER(description) ~* '\b(property.*management|real.*estate|property.*development|construction.*management|estate.*agent|property.*sales|realty)\b'
  );

-- Transportation
UPDATE jobs
SET industries = industries || ARRAY['Transportation']
WHERE NOT (industries @> ARRAY['Transportation'])
  AND (
    LOWER(company) ~* '\b(transport|logistics|shipping|freight|delivery|courier|postal|mail|distribution|transportation|logistics.*company|shipping.*company|dhl|fedex|ups)\b'
    OR LOWER(description) ~* '\b(logistics|supply.*chain|transportation|shipping|warehouse|distribution|freight|delivery|logistics.*management)\b'
  );

-- Automotive
UPDATE jobs
SET industries = industries || ARRAY['Automotive']
WHERE NOT (industries @> ARRAY['Automotive'])
  AND (
    LOWER(company) ~* '\b(automotive|car|vehicle|auto|toyota|volkswagen|bmw|mercedes|ford|tesla|nissan|honda|car.*manufacturer|auto.*industry|vehicle.*manufacturing)\b'
    OR LOWER(description) ~* '\b(automotive|vehicle|auto.*industry|car.*manufacturing|automotive.*engineering)\b'
  );

-- Fashion
UPDATE jobs
SET industries = industries || ARRAY['Fashion']
WHERE NOT (industries @> ARRAY['Fashion'])
  AND (
    LOWER(company) ~* '\b(fashion|apparel|clothing|textile|garment|retail.*fashion|luxury|designer|fashion.*brand|clothing.*brand|apparel.*company)\b'
    OR LOWER(description) ~* '\b(fashion|apparel|clothing|textile|fashion.*design|retail.*fashion|merchandising|fashion.*buying|fashion.*marketing)\b'
  );

-- Food & Beverage
UPDATE jobs
SET industries = industries || ARRAY['Food & Beverage']
WHERE NOT (industries @> ARRAY['Food & Beverage'])
  AND (
    LOWER(company) ~* '\b(food|beverage|restaurant|cafe|catering|hospitality|hotel|tourism|travel|food.*company|beverage.*company|restaurant.*chain|food.*service)\b'
    OR LOWER(description) ~* '\b(restaurant|hospitality|food.*service|catering|beverage|food.*production|hotel.*management|tourism|hospitality.*management)\b'
  );

-- Travel
UPDATE jobs
SET industries = industries || ARRAY['Travel']
WHERE NOT (industries @> ARRAY['Travel'])
  AND (
    LOWER(company) ~* '\b(travel|tourism|hotel|hospitality|airline|airport|booking|trip|vacation|holiday|travel.*company|tourism.*company|hotel.*chain|airline.*company)\b'
    OR LOWER(description) ~* '\b(travel|tourism|hotel|hospitality|airline|travel.*booking|tourism.*management|vacation|holiday|travel.*services)\b'
  );

-- Verify extraction results
SELECT 
  COUNT(*) as total_jobs,
  SUM(CASE WHEN industries IS NOT NULL AND array_length(industries, 1) > 0 THEN 1 ELSE 0 END) as jobs_with_industries,
  ROUND(100.0 * SUM(CASE WHEN industries IS NOT NULL AND array_length(industries, 1) > 0 THEN 1 ELSE 0 END) / COUNT(*), 2) as coverage_percent,
  COUNT(DISTINCT unnest(industries)) as unique_industries_found
FROM jobs;

