-- Industry Extraction Migration (Batched Approach)
-- Extracts industries from company names and descriptions for all jobs
-- Uses efficient pattern matching - processes one industry at a time

-- Technology (general tech companies)
UPDATE jobs
SET industries = industries || ARRAY['Technology']
WHERE NOT (industries @> ARRAY['Technology'])
  AND (
    LOWER(company) ~* '(tech|technology|it|platform|digital|cloud|ai|ml|data.*tech|tech.*company|tech.*firm|startup|scaleup)'
    OR LOWER(company) ~* '(amazon|google|microsoft|apple|meta|facebook|netflix|spotify|uber|airbnb|oracle|ibm|sap|adobe)'
    OR LOWER(description) ~* '(software.*development|programming|coding|developer|engineer|devops|cloud.*computing|api|backend|frontend|full.*stack|machine.*learning|artificial.*intelligence|it.*infrastructure|systems.*administration|network.*engineering)'
  );

-- SaaS (software as a service)
UPDATE jobs
SET industries = industries || ARRAY['SaaS']
WHERE NOT (industries @> ARRAY['SaaS'])
  AND (
    LOWER(company) ~* '(saas|software.*as.*service|cloud.*software|subscription.*software|platform.*as.*service|software.*company|saas.*company|cloud.*platform)'
    OR LOWER(company) ~* '(salesforce|hubspot|zendesk|slack|notion|asana|monday|atlassian|workday|servicenow)'
    OR LOWER(description) ~* '(saas|software.*as.*service|cloud.*platform|subscription.*model|platform.*development|crm|erp|hr.*software|business.*software|enterprise.*software)'
  );

-- Software (software development companies)
UPDATE jobs
SET industries = industries || ARRAY['Software']
WHERE NOT (industries @> ARRAY['Software'])
  AND (
    LOWER(company) ~* '(software|software.*development|software.*company|software.*firm|software.*solutions|application.*development|app.*development|software.*engineering)'
    OR LOWER(description) ~* '(software.*development|application.*development|software.*engineering|software.*design|programming|coding|software.*architecture|software.*testing)'
  );

-- Finance (general finance)
UPDATE jobs
SET industries = industries || ARRAY['Finance']
WHERE NOT (industries @> ARRAY['Finance'])
  AND (
    LOWER(company) ~* '(finance|financial|investment|invest|capital|wealth|asset|trading|trader|broker|fund|hedge|accounting|audit|tax|accountant|cpa|cfa|actuary|actuarial)'
    OR LOWER(company) ~* '(goldman|morgan|jpmorgan|barclays|hsbc|ubs|credit.*suisse|bnp|societe.*generale)'
    OR LOWER(description) ~* '(financial.*analysis|investment.*banking|risk.*management|portfolio.*management|accounting|audit|tax.*advisory|corporate.*finance|m&a|mergers.*acquisitions)'
  );

-- Banking
UPDATE jobs
SET industries = industries || ARRAY['Banking']
WHERE NOT (industries @> ARRAY['Banking'])
  AND (
    LOWER(company) ~* '(bank|banking|commercial.*bank|investment.*bank|retail.*bank|private.*bank|deutsche.*bank|barclays|hsbc|lloyds|santander|bnp.*paribas|societe.*generale|bank.*of|banking.*services|financial.*institution)'
    OR LOWER(description) ~* '(banking|commercial.*banking|investment.*banking|retail.*banking|private.*banking|bank.*operations|credit.*analysis|loan.*processing|banking.*services)'
  );

-- Insurance
UPDATE jobs
SET industries = industries || ARRAY['Insurance']
WHERE NOT (industries @> ARRAY['Insurance'])
  AND (
    LOWER(company) ~* '(insurance|insurer|underwriting|actuarial|claims|reinsurance|allianz|axa|zurich|generali|aviva|prudential|legal.*general|insurance.*company|insurance.*services|life.*insurance|health.*insurance)'
    OR LOWER(description) ~* '(insurance|underwriting|claims.*processing|actuarial|risk.*assessment|life.*insurance|health.*insurance|property.*insurance|reinsurance)'
  );

-- Consulting
UPDATE jobs
SET industries = industries || ARRAY['Consulting']
WHERE NOT (industries @> ARRAY['Consulting'])
  AND (
    LOWER(company) ~* '(consulting|consultant|advisory|adviser|mckinsey|bain|bcg|deloitte|pwc|ey|kpmg|accenture|capgemini|strategy.*consulting|management.*consulting|business.*consulting)'
    OR LOWER(description) ~* '(management.*consulting|strategy.*consulting|business.*transformation|advisory.*services|client.*engagement|project.*management|change.*management)'
  );

-- Professional Services
UPDATE jobs
SET industries = industries || ARRAY['Professional Services']
WHERE NOT (industries @> ARRAY['Professional Services'])
  AND (
    LOWER(company) ~* '(professional.*services|business.*services|corporate.*services|advisory.*services|legal.*services|accounting.*services|tax.*services|audit.*services|business.*consulting|management.*services|corporate.*advisory)'
    OR LOWER(description) ~* '(professional.*services|business.*services|corporate.*services|advisory.*services|legal.*services|accounting.*services|tax.*services|audit.*services|business.*consulting|management.*services|corporate.*advisory)'
  );

-- Retail (physical retail)
UPDATE jobs
SET industries = industries || ARRAY['Retail']
WHERE NOT (industries @> ARRAY['Retail'])
  AND (
    LOWER(company) ~* '(retail|store|shop|supermarket|grocery|brick.*mortar|physical.*retail|fashion.*retail|consumer.*goods|fcmg|retail.*chain)'
    OR LOWER(description) ~* '(retail.*operations|store.*management|merchandising|brick.*mortar|physical.*retail|customer.*service|sales.*associate|retail.*sales|store.*assistant)'
  );

-- E-commerce
UPDATE jobs
SET industries = industries || ARRAY['E-commerce']
WHERE NOT (industries @> ARRAY['E-commerce'])
  AND (
    LOWER(company) ~* '(ecommerce|e-commerce|online.*retail|digital.*marketplace|online.*store|amazon|alibaba|ebay|etsy|shopify|woocommerce|magento|online.*shopping|digital.*commerce|internet.*retail)'
    OR LOWER(description) ~* '(ecommerce|e-commerce|online.*retail|digital.*marketplace|online.*store|online.*shopping|digital.*commerce|internet.*retail|web.*store|online.*sales|digital.*sales|ecommerce.*operations)'
  );

-- Manufacturing
UPDATE jobs
SET industries = industries || ARRAY['Manufacturing']
WHERE NOT (industries @> ARRAY['Manufacturing'])
  AND (
    LOWER(company) ~* '(manufacturing|factory|production|industrial|engineering|automation|supply.*chain|manufacturer|producer|assembly|fabrication)'
    OR LOWER(description) ~* '(production.*management|quality.*control|manufacturing.*process|industrial.*engineering|supply.*chain|procurement|operations.*management)'
  );

-- Consumer Goods
UPDATE jobs
SET industries = industries || ARRAY['Consumer Goods']
WHERE NOT (industries @> ARRAY['Consumer Goods'])
  AND (
    LOWER(company) ~* '(consumer.*goods|fmcg|fast.*moving.*consumer.*goods|cpg|consumer.*products|unilever|procter.*gamble|nestle|p&g|reckitt|henkel|danone|consumer.*packaged.*goods|household.*products)'
    OR LOWER(description) ~* '(consumer.*goods|fmcg|fast.*moving.*consumer.*goods|cpg|consumer.*products|consumer.*packaged.*goods|household.*products|personal.*care.*products|brand.*management|product.*marketing|category.*management)'
  );

-- Energy
UPDATE jobs
SET industries = industries || ARRAY['Energy']
WHERE NOT (industries @> ARRAY['Energy'])
  AND (
    LOWER(company) ~* '(energy|power|oil|gas|petroleum|renewable|solar|wind|nuclear|utilities|utility|energy.*company|power.*company|oil.*company|gas.*company)'
    OR LOWER(description) ~* '(energy.*management|renewable.*energy|solar.*power|wind.*energy|power.*generation|utilities|energy.*trading|oil.*gas)'
  );

-- Media
UPDATE jobs
SET industries = industries || ARRAY['Media']
WHERE NOT (industries @> ARRAY['Media'])
  AND (
    LOWER(company) ~* '(media|publishing|journalism|journalist|news|broadcast|tv|television|radio|magazine|newspaper|entertainment|content|streaming)'
    OR LOWER(description) ~* '(content.*creation|journalism|media.*production|broadcasting|digital.*media|editorial|publishing|media.*relations|pr|public.*relations)'
  );

-- Advertising
UPDATE jobs
SET industries = industries || ARRAY['Advertising']
WHERE NOT (industries @> ARRAY['Advertising'])
  AND (
    LOWER(company) ~* '(advertising|ad.*agency|marketing.*agency|creative.*agency|media.*agency|ogilvy|wpp|publicis|omnicom|dentsu|havas|interpublic|digital.*marketing|performance.*marketing|ad.*tech|programmatic)'
    OR LOWER(description) ~* '(advertising|ad.*campaign|creative.*advertising|media.*buying|ad.*placement|digital.*marketing|performance.*marketing|ad.*tech|programmatic.*advertising|marketing.*agency|creative.*agency|media.*agency|ad.*agency)'
  );

-- Non-profit
UPDATE jobs
SET industries = industries || ARRAY['Non-profit']
WHERE NOT (industries @> ARRAY['Non-profit'])
  AND (
    LOWER(company) ~* '(nonprofit|non-profit|ngo|charity|foundation|volunteer|social.*impact|philanthropy|not.*for.*profit|npo|charitable)'
    OR LOWER(description) ~* '(social.*impact|charity|fundraising|nonprofit|ngo|volunteer.*management|community.*development|social.*services|philanthropy)'
  );

-- Real Estate
UPDATE jobs
SET industries = industries || ARRAY['Real Estate']
WHERE NOT (industries @> ARRAY['Real Estate'])
  AND (
    LOWER(company) ~* '(real.*estate|property|realtor|estate.*agent|property.*management|construction|building|proptech|property.*development|realty)'
    OR LOWER(description) ~* '(property.*management|real.*estate|property.*development|construction.*management|estate.*agent|property.*sales|realty)'
  );

-- Transportation
UPDATE jobs
SET industries = industries || ARRAY['Transportation']
WHERE NOT (industries @> ARRAY['Transportation'])
  AND (
    LOWER(company) ~* '(transport|transportation|shipping|freight|delivery|courier|postal|mail|distribution|transportation.*company|shipping.*company|dhl|fedex|ups|dpd|hermes)'
    OR LOWER(description) ~* '(transportation|shipping|freight|delivery|courier|postal|mail|distribution|transport.*services|shipping.*services|freight.*services)'
  );

-- Logistics
UPDATE jobs
SET industries = industries || ARRAY['Logistics']
WHERE NOT (industries @> ARRAY['Logistics'])
  AND (
    LOWER(company) ~* '(logistics|supply.*chain|warehouse|distribution|fulfillment|3pl|third.*party.*logistics|logistics.*company|supply.*chain.*management|warehouse.*management|dhl|fedex|ups|db.*schenker|kuehne.*nagel|dsv|geodis)'
    OR LOWER(description) ~* '(logistics|supply.*chain|warehouse|distribution|fulfillment|3pl|third.*party.*logistics|logistics.*management|supply.*chain.*management|warehouse.*management|inventory.*management|order.*fulfillment|distribution.*center)'
  );

-- Automotive
UPDATE jobs
SET industries = industries || ARRAY['Automotive']
WHERE NOT (industries @> ARRAY['Automotive'])
  AND (
    LOWER(company) ~* '(automotive|car|vehicle|auto|toyota|volkswagen|bmw|mercedes|ford|tesla|nissan|honda|car.*manufacturer|auto.*industry|vehicle.*manufacturing)'
    OR LOWER(description) ~* '(automotive|vehicle|auto.*industry|car.*manufacturing|automotive.*engineering)'
  );

-- Fashion
UPDATE jobs
SET industries = industries || ARRAY['Fashion']
WHERE NOT (industries @> ARRAY['Fashion'])
  AND (
    LOWER(company) ~* '(fashion|apparel|clothing|textile|garment|retail.*fashion|luxury|designer|fashion.*brand|clothing.*brand|apparel.*company)'
    OR LOWER(description) ~* '(fashion|apparel|clothing|textile|fashion.*design|retail.*fashion|merchandising|fashion.*buying|fashion.*marketing)'
  );

-- Food & Beverage
UPDATE jobs
SET industries = industries || ARRAY['Food & Beverage']
WHERE NOT (industries @> ARRAY['Food & Beverage'])
  AND (
    LOWER(company) ~* '(food|beverage|restaurant|cafe|catering|hospitality|hotel|tourism|travel|food.*company|beverage.*company|restaurant.*chain|food.*service)'
    OR LOWER(description) ~* '(restaurant|hospitality|food.*service|catering|beverage|food.*production|hotel.*management|tourism|hospitality.*management)'
  );

-- Travel
UPDATE jobs
SET industries = industries || ARRAY['Travel']
WHERE NOT (industries @> ARRAY['Travel'])
  AND (
    LOWER(company) ~* '(travel|tourism|hotel|hospitality|airline|airport|booking|trip|vacation|holiday|travel.*company|tourism.*company|hotel.*chain|airline.*company)'
    OR LOWER(description) ~* '(travel|tourism|hotel|hospitality|airline|travel.*booking|tourism.*management|vacation|holiday|travel.*services)'
  );

-- Telecommunications
UPDATE jobs
SET industries = industries || ARRAY['Telecommunications']
WHERE NOT (industries @> ARRAY['Telecommunications'])
  AND (
    LOWER(company) ~* '(telecom|telecommunications|telco|mobile.*operator|network.*operator|vodafone|orange|telefonica|deutsche.*telekom|bt|ee|three|o2|telecom.*company|telecommunications.*services|network.*services)'
    OR LOWER(description) ~* '(telecom|telecommunications|mobile.*network|fixed.*line|broadband|telecom.*services|network.*services|mobile.*services|internet.*services|5g|4g|lte|fiber|telecom.*infrastructure)'
  );

