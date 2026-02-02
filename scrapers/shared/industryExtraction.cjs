/**
 * Industry Extraction Utility
 * Extracts industries from company names and job descriptions
 * Used for premium user industry-based filtering
 */

// Industry categories from signup form constants
// Aligned with 9 career paths - expanded list for better matching
// Maps: strategy-business-design → Consulting, Professional Services
//       data-analytics → Technology, Finance, SaaS, Banking
//       sales-client-success → Retail, E-commerce, SaaS, Fashion, Travel, Food & Beverage
//       marketing-growth → Media, Advertising, E-commerce, Retail, Fashion
//       finance-investment → Finance, Banking, Insurance
//       operations-supply-chain → Manufacturing, Transportation, Automotive, Real Estate, Energy, Consumer Goods, Logistics
//       product-innovation → Technology, SaaS, Software
//       tech-transformation → Technology, SaaS, Software, Telecommunications
//       sustainability-esg → Energy, Non-profit
const INDUSTRIES = [
	"Technology",
	"SaaS",
	"Software",
	"Finance",
	"Banking",
	"Insurance",
	"Consulting",
	"Professional Services",
	"Retail",
	"E-commerce",
	"Manufacturing",
	"Consumer Goods",
	"Energy",
	"Media",
	"Advertising",
	"Non-profit",
	"Real Estate",
	"Transportation",
	"Logistics",
	"Automotive",
	"Fashion",
	"Food & Beverage",
	"Travel",
	"Telecommunications",
];

// Company name patterns for industry detection
const COMPANY_PATTERNS = {
	Technology: [
		/\b(tech|technology|it|platform|digital|cloud|ai|ml|data.*tech|tech.*company|tech.*firm)\b/i,
		/\b(amazon|google|microsoft|apple|meta|facebook|netflix|spotify|uber|airbnb|oracle|ibm|sap|adobe)\b/i,
		/\b(startup|scaleup|fintech|edtech|healthtech|proptech|insurtech)\b/i,
	],
	SaaS: [
		/\b(saas|software.*as.*service|cloud.*software|subscription.*software|platform.*as.*service)\b/i,
		/\b(salesforce|hubspot|zendesk|slack|notion|asana|monday|atlassian|workday|servicenow)\b/i,
		/\b(software.*company|saas.*company|cloud.*platform)\b/i,
	],
	Software: [
		/\b(software|software.*development|software.*company|software.*firm|software.*solutions)\b/i,
		/\b(application.*development|app.*development|software.*engineering)\b/i,
	],
	Finance: [
		/\b(finance|financial|investment|invest|capital|wealth|asset|trading|trader|broker|fund|hedge)\b/i,
		/\b(goldman|morgan|jpmorgan|barclays|hsbc|ubs|credit.*suisse|bnp|societe.*generale)\b/i,
		/\b(accounting|audit|tax|accountant|cpa|cfa|actuary|actuarial)\b/i,
	],
	Banking: [
		/\b(bank|banking|commercial.*bank|investment.*bank|retail.*bank|private.*bank)\b/i,
		/\b(deutsche.*bank|barclays|hsbc|lloyds|santander|bnp.*paribas|societe.*generale)\b/i,
		/\b(bank.*of|banking.*services|financial.*institution)\b/i,
	],
	Insurance: [
		/\b(insurance|insurer|underwriting|actuarial|claims|reinsurance)\b/i,
		/\b(allianz|axa|zurich|generali|aviva|prudential|legal.*general)\b/i,
		/\b(insurance.*company|insurance.*services|life.*insurance|health.*insurance)\b/i,
	],
	Consulting: [
		/\b(consulting|consultant|advisory|adviser|mckinsey|bain|bcg|deloitte|pwc|ey|kpmg|accenture|capgemini)\b/i,
		/\b(strategy.*consulting|management.*consulting|business.*consulting)\b/i,
	],
	"Professional Services": [
		/\b(professional.*services|business.*services|corporate.*services|advisory.*services)\b/i,
		/\b(legal.*services|accounting.*services|tax.*services|audit.*services)\b/i,
		/\b(business.*consulting|management.*services|corporate.*advisory)\b/i,
	],
	Retail: [
		/\b(retail|store|shop|supermarket|grocery|brick.*mortar|physical.*retail)\b/i,
		/\b(fashion.*retail|consumer.*goods|fcmg|retail.*chain)\b/i,
	],
	"E-commerce": [
		/\b(ecommerce|e-commerce|online.*retail|digital.*marketplace|online.*store)\b/i,
		/\b(amazon|alibaba|ebay|etsy|shopify|woocommerce|magento)\b/i,
		/\b(online.*shopping|digital.*commerce|internet.*retail)\b/i,
	],
	Manufacturing: [
		/\b(manufacturing|factory|production|industrial|engineering|automation|supply.*chain)\b/i,
		/\b(manufacturer|producer|assembly|fabrication)\b/i,
	],
	Energy: [
		/\b(energy|power|oil|gas|petroleum|renewable|solar|wind|nuclear|utilities|utility)\b/i,
		/\b(energy.*company|power.*company|oil.*company|gas.*company)\b/i,
	],
	Media: [
		/\b(media|publishing|journalism|journalist|news|broadcast|tv|television|radio|magazine|newspaper)\b/i,
		/\b(entertainment|content|streaming|netflix|disney|warner|paramount)\b/i,
	],
	"Non-profit": [
		/\b(nonprofit|non-profit|ngo|charity|foundation|volunteer|social.*impact|philanthropy)\b/i,
		/\b(not.*for.*profit|npo|charitable)\b/i,
	],
	"Real Estate": [
		/\b(real.*estate|property|realtor|estate.*agent|property.*management|construction|building)\b/i,
		/\b(proptech|property.*development|realty)\b/i,
	],
	Transportation: [
		/\b(transport|transportation|shipping|freight|delivery|courier|postal|mail|distribution)\b/i,
		/\b(transportation.*company|shipping.*company|dhl|fedex|ups|dpd|hermes)\b/i,
	],
	Logistics: [
		/\b(logistics|supply.*chain|warehouse|distribution|fulfillment|3pl|third.*party.*logistics)\b/i,
		/\b(logistics.*company|supply.*chain.*management|warehouse.*management)\b/i,
		/\b(dhl|fedex|ups|db.*schenker|kuehne.*nagel|dsv|geodis)\b/i,
	],
	"Consumer Goods": [
		/\b(consumer.*goods|fmcg|fast.*moving.*consumer.*goods|cpg|consumer.*products)\b/i,
		/\b(unilever|procter.*gamble|nestle|p&g|reckitt|henkel|danone)\b/i,
		/\b(consumer.*packaged.*goods|household.*products)\b/i,
	],
	Advertising: [
		/\b(advertising|ad.*agency|marketing.*agency|creative.*agency|media.*agency)\b/i,
		/\b(ogilvy|wpp|publicis|omnicom|dentsu|havas|interpublic)\b/i,
		/\b(digital.*marketing|performance.*marketing|ad.*tech|programmatic)\b/i,
	],
	Telecommunications: [
		/\b(telecom|telecommunications|telco|mobile.*operator|network.*operator)\b/i,
		/\b(vodafone|orange|telefonica|deutsche.*telekom|bt|ee|three|o2)\b/i,
		/\b(telecom.*company|telecommunications.*services|network.*services)\b/i,
	],
	Automotive: [
		/\b(automotive|car|vehicle|auto|toyota|volkswagen|bmw|mercedes|ford|tesla|nissan|honda)\b/i,
		/\b(car.*manufacturer|auto.*industry|vehicle.*manufacturing)\b/i,
	],
	Fashion: [
		/\b(fashion|apparel|clothing|textile|garment|retail.*fashion|luxury|designer)\b/i,
		/\b(fashion.*brand|clothing.*brand|apparel.*company)\b/i,
	],
	"Food & Beverage": [
		/\b(food|beverage|restaurant|cafe|catering|hospitality|hotel|tourism|travel)\b/i,
		/\b(food.*company|beverage.*company|restaurant.*chain|food.*service)\b/i,
	],
	Travel: [
		/\b(travel|tourism|hotel|hospitality|airline|airport|booking|trip|vacation|holiday)\b/i,
		/\b(travel.*company|tourism.*company|hotel.*chain|airline.*company)\b/i,
	],
};

// Description keyword patterns (more specific than company patterns)
const DESCRIPTION_PATTERNS = {
	Technology: [
		/\b(software.*development|programming|coding|developer|engineer|devops|cloud.*computing)\b/i,
		/\b(api|backend|frontend|full.*stack|machine.*learning|artificial.*intelligence)\b/i,
		/\b(it.*infrastructure|systems.*administration|network.*engineering)\b/i,
	],
	SaaS: [
		/\b(saas|software.*as.*service|cloud.*platform|subscription.*model|platform.*development)\b/i,
		/\b(crm|erp|hr.*software|business.*software|enterprise.*software)\b/i,
	],
	Software: [
		/\b(software.*development|application.*development|software.*engineering|software.*design)\b/i,
		/\b(programming|coding|software.*architecture|software.*testing)\b/i,
	],
	Finance: [
		/\b(financial.*analysis|investment.*banking|risk.*management|portfolio.*management)\b/i,
		/\b(accounting|audit|tax.*advisory|corporate.*finance|m&a|mergers.*acquisitions)\b/i,
	],
	Banking: [
		/\b(banking|commercial.*banking|investment.*banking|retail.*banking|private.*banking)\b/i,
		/\b(bank.*operations|credit.*analysis|loan.*processing|banking.*services)\b/i,
	],
	Insurance: [
		/\b(insurance|underwriting|claims.*processing|actuarial|risk.*assessment)\b/i,
		/\b(life.*insurance|health.*insurance|property.*insurance|reinsurance)\b/i,
	],
	Consulting: [
		/\b(management.*consulting|strategy.*consulting|business.*transformation|advisory.*services)\b/i,
		/\b(client.*engagement|project.*management|change.*management)\b/i,
	],
	"Professional Services": [
		/\b(professional.*services|business.*services|corporate.*services|advisory.*services)\b/i,
		/\b(legal.*services|accounting.*services|tax.*services|audit.*services)\b/i,
		/\b(business.*consulting|management.*services|corporate.*advisory)\b/i,
	],
	Retail: [
		/\b(retail.*operations|store.*management|merchandising|brick.*mortar|physical.*retail)\b/i,
		/\b(customer.*service|sales.*associate|retail.*sales|store.*assistant)\b/i,
	],
	"E-commerce": [
		/\b(ecommerce|e-commerce|online.*retail|digital.*marketplace|online.*store)\b/i,
		/\b(online.*shopping|digital.*commerce|internet.*retail|web.*store)\b/i,
		/\b(online.*sales|digital.*sales|ecommerce.*operations)\b/i,
	],
	Manufacturing: [
		/\b(production.*management|quality.*control|manufacturing.*process|industrial.*engineering)\b/i,
		/\b(supply.*chain|procurement|operations.*management)\b/i,
	],
	Energy: [
		/\b(energy.*management|renewable.*energy|solar.*power|wind.*energy|power.*generation)\b/i,
		/\b(utilities|energy.*trading|oil.*gas)\b/i,
	],
	Media: [
		/\b(content.*creation|journalism|media.*production|broadcasting|digital.*media)\b/i,
		/\b(editorial|publishing|media.*relations|pr|public.*relations)\b/i,
	],
	"Non-profit": [
		/\b(social.*impact|charity|fundraising|nonprofit|ngo|volunteer.*management)\b/i,
		/\b(community.*development|social.*services|philanthropy)\b/i,
	],
	"Real Estate": [
		/\b(property.*management|real.*estate|property.*development|construction.*management)\b/i,
		/\b(estate.*agent|property.*sales|realty)\b/i,
	],
	Transportation: [
		/\b(transportation|shipping|freight|delivery|courier|postal|mail|distribution)\b/i,
		/\b(transport.*services|shipping.*services|freight.*services)\b/i,
	],
	Logistics: [
		/\b(logistics|supply.*chain|warehouse|distribution|fulfillment|3pl|third.*party.*logistics)\b/i,
		/\b(logistics.*management|supply.*chain.*management|warehouse.*management)\b/i,
		/\b(inventory.*management|order.*fulfillment|distribution.*center)\b/i,
	],
	"Consumer Goods": [
		/\b(consumer.*goods|fmcg|fast.*moving.*consumer.*goods|cpg|consumer.*products)\b/i,
		/\b(consumer.*packaged.*goods|household.*products|personal.*care.*products)\b/i,
		/\b(brand.*management|product.*marketing|category.*management)\b/i,
	],
	Advertising: [
		/\b(advertising|ad.*campaign|creative.*advertising|media.*buying|ad.*placement)\b/i,
		/\b(digital.*marketing|performance.*marketing|ad.*tech|programmatic.*advertising)\b/i,
		/\b(marketing.*agency|creative.*agency|media.*agency|ad.*agency)\b/i,
	],
	Telecommunications: [
		/\b(telecom|telecommunications|mobile.*network|fixed.*line|broadband)\b/i,
		/\b(telecom.*services|network.*services|mobile.*services|internet.*services)\b/i,
		/\b(5g|4g|lte|fiber|telecom.*infrastructure)\b/i,
	],
	Automotive: [
		/\b(automotive|vehicle|auto.*industry|car.*manufacturing|automotive.*engineering)\b/i,
	],
	Fashion: [
		/\b(fashion|apparel|clothing|textile|fashion.*design|retail.*fashion)\b/i,
		/\b(merchandising|fashion.*buying|fashion.*marketing)\b/i,
	],
	"Food & Beverage": [
		/\b(restaurant|hospitality|food.*service|catering|beverage|food.*production)\b/i,
		/\b(hotel.*management|tourism|hospitality.*management)\b/i,
	],
	Travel: [
		/\b(travel|tourism|hotel|hospitality|airline|travel.*booking|tourism.*management)\b/i,
		/\b(vacation|holiday|travel.*services)\b/i,
	],
};

/**
 * Extract industries from company name and description
 * @param {string} company - Company name
 * @param {string} description - Job description
 * @returns {string[]} Array of matched industries
 */
function extractIndustries(company = "", description = "") {
	const industries = [];
	const companyLower = (company || "").toLowerCase();
	const descLower = (description || "").toLowerCase();
	const combinedText = `${companyLower} ${descLower}`.toLowerCase();

	// Check each industry pattern
	for (const [industry, patterns] of Object.entries(COMPANY_PATTERNS)) {
		// Check company name patterns first (higher confidence)
		const companyMatch = patterns.some((pattern) => pattern.test(companyLower));

		// Check description patterns (secondary)
		const descMatch = DESCRIPTION_PATTERNS[industry]?.some((pattern) =>
			pattern.test(descLower),
		);

		// If either matches, add industry
		if (companyMatch || descMatch) {
			industries.push(industry);
		}
	}

	// Remove duplicates and return
	return [...new Set(industries)];
}

/**
 * Get all available industries
 * @returns {string[]} Array of all industry names
 */
function getAllIndustries() {
	return [...INDUSTRIES];
}

module.exports = {
	extractIndustries,
	getAllIndustries,
	INDUSTRIES,
};
